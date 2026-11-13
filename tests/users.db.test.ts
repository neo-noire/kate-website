/**
 * Deactivating and deleting accounts. Runs against the database in DATABASE_URL (migrated);
 * skipped without one. Locally: start Postgres, `npm run db:migrate`, then `DATABASE_URL=… npm test`.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;

describe.skipIf(!url)("account deactivation and deletion", async () => {
  process.env.BETTER_AUTH_SECRET ??= "x".repeat(32);
  const { db } = await import("@/db");
  const { account, contactMessage, course, lessonNote, newsletterSubscriber, program, purchase, session, user } = await import("@/db/schema");
  const { auth } = await import("@/lib/auth/server");
  const { anonymizeUser, deactivateUser, reactivateUser } = await import("@/lib/users");
  const { getUsersPage } = await import("@/lib/catalog/admin-queries");
  const { eq } = await import("drizzle-orm");

  const ids = { user: "test-users-carol", program: "test-users-program", course: "test-users-course" };
  const email = "carol@test.invalid";

  async function clean() {
    await db.delete(contactMessage).where(eq(contactMessage.email, email));
    await db.delete(newsletterSubscriber).where(eq(newsletterSubscriber.email, email));
    await db.delete(user).where(eq(user.id, ids.user));
    await db.delete(program).where(eq(program.id, ids.program));
  }

  beforeAll(clean);
  afterAll(clean);

  beforeEach(async () => {
    await clean();
    await db.insert(user).values({ id: ids.user, name: "Carol", email, emailVerified: true });
    await db.insert(program).values({ id: ids.program, slug: "test-users-program", title: { en: "Test" }, status: "published" });
    await db.insert(course).values({ id: ids.course, programId: ids.program, slug: "salsa", title: { en: "Salsa" } });
    await db.insert(purchase).values({ id: "test-users-purchase", userId: ids.user, courseId: ids.course, source: "admin" });
  });

  const signIn = async () => (await auth.$context).internalAdapter.createSession(ids.user);

  it("records the last login when a session is created", async () => {
    await signIn();
    const [row] = await db.select({ lastLoginAt: user.lastLoginAt }).from(user).where(eq(user.id, ids.user));
    expect(row.lastLoginAt).toBeInstanceOf(Date);
  });

  it("signs a deactivated account out everywhere and refuses new sign-ins until it is reactivated", async () => {
    await signIn();
    await signIn();
    await deactivateUser(ids.user, "spam");
    expect(await db.select().from(session).where(eq(session.userId, ids.user))).toHaveLength(0);
    await expect(signIn()).rejects.toThrow(/deactivated/i);
    expect(await db.select().from(session).where(eq(session.userId, ids.user))).toHaveLength(0);

    await reactivateUser(ids.user);
    await expect(signIn()).resolves.toBeTruthy();
  });

  it("deletes a person's data but keeps the purchase, and frees the email", async () => {
    await db.insert(account).values({ id: "test-users-account", accountId: ids.user, providerId: "credential", userId: ids.user, password: "hash" });
    await db.insert(contactMessage).values({ id: "test-users-msg", name: "Carol", email, message: "hi", locale: "en", userId: ids.user });
    await db.insert(newsletterSubscriber).values({ email, locale: "en" });
    await signIn();

    await anonymizeUser(ids.user);

    const [row] = await db.select().from(user).where(eq(user.id, ids.user));
    expect(row.name).toBe("Deleted user");
    expect(row.email).not.toBe(email);
    expect(row.deletedAt).toBeInstanceOf(Date);
    expect(row.deactivatedAt).toBeInstanceOf(Date);
    expect(await db.select().from(session).where(eq(session.userId, ids.user))).toHaveLength(0);
    expect(await db.select().from(account).where(eq(account.userId, ids.user))).toHaveLength(0);
    expect(await db.select().from(contactMessage).where(eq(contactMessage.email, email))).toHaveLength(0);
    expect(await db.select().from(newsletterSubscriber).where(eq(newsletterSubscriber.email, email))).toHaveLength(0);
    expect(await db.select().from(lessonNote).where(eq(lessonNote.userId, ids.user))).toHaveLength(0);
    expect(await db.select().from(purchase).where(eq(purchase.userId, ids.user))).toHaveLength(1);
    await expect(signIn()).rejects.toThrow(/deactivated/i);

    // The address can be used for a new account.
    await db.insert(user).values({ id: "test-users-carol-again", name: "Carol", email });
    await db.delete(user).where(eq(user.id, "test-users-carol-again"));
  });

  it("finds accounts by name or email, treating % and _ literally", async () => {
    expect((await getUsersPage("carol@test", 1)).rows.map((r) => r.id)).toContain(ids.user);
    expect((await getUsersPage("no-such-person-zzz", 1)).total).toBe(0);
    expect((await getUsersPage("%", 1)).rows.map((r) => r.id)).not.toContain(ids.user);
  });
});
