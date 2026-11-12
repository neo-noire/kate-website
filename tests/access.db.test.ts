/**
 * Who can watch what. Runs against the database in DATABASE_URL (migrated); skipped without one.
 * Locally: start Postgres, `npm run db:migrate`, then `DATABASE_URL=… npm test`.
 */
import type Stripe from "stripe";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;

describe.skipIf(!url)("course access", async () => {
  const { db } = await import("@/db");
  const { course, lesson, program, purchase, rateLimit, stripeEvent, tier, user } = await import("@/db/schema");
  const { getLibrary, getPlayableLesson, getPurchase } = await import("@/lib/catalog/queries");
  const { fulfillCheckoutSession, restoreDisputedPayment, revokePayment } = await import("@/lib/stripe/server");
  const { consumeRateLimit } = await import("@/lib/rate-limit");
  const { eq, inArray } = await import("drizzle-orm");

  const ids = {
    program: "test-program",
    course: "test-course",
    otherCourse: "test-course-2",
    tier: "test-tier",
    lesson: "test-lesson",
    preview: "test-preview",
    otherLesson: "test-lesson-2",
    alice: "test-alice",
    bob: "test-bob",
  };

  async function clean() {
    await db.delete(user).where(inArray(user.id, [ids.alice, ids.bob]));
    await db.delete(program).where(eq(program.id, ids.program));
    await db.delete(stripeEvent).where(eq(stripeEvent.type, "test"));
    await db.delete(rateLimit).where(eq(rateLimit.key, "test:key"));
  }

  beforeAll(async () => {
    await clean();
    await db.insert(user).values([
      { id: ids.alice, name: "Alice", email: "alice@test.invalid", emailVerified: true },
      { id: ids.bob, name: "Bob", email: "bob@test.invalid", emailVerified: true },
    ]);
    await db.insert(program).values({ id: ids.program, slug: "test-program", title: { en: "Test" }, status: "published" });
    await db.insert(course).values([
      { id: ids.course, programId: ids.program, slug: "samba", title: { en: "Samba" } },
      { id: ids.otherCourse, programId: ids.program, slug: "rumba", title: { en: "Rumba" } },
    ]);
    await db.insert(tier).values({ id: ids.tier, programId: ids.program, name: { en: "Solo" }, priceCents: 3900, currency: "CAD" });
    await db.insert(lesson).values([
      { id: ids.lesson, courseId: ids.course, title: { en: "Lesson 1" }, videoId: "aaaaaaaaaaa" },
      { id: ids.preview, courseId: ids.course, title: { en: "Preview" }, videoId: "bbbbbbbbbbb", isPreview: true },
      { id: ids.otherLesson, courseId: ids.otherCourse, title: { en: "Rumba 1" }, videoId: "ccccccccccc" },
    ]);
  });

  afterAll(async () => {
    await clean();
    await db.$client.end();
  });

  beforeEach(async () => {
    await db.delete(purchase).where(inArray(purchase.userId, [ids.alice, ids.bob]));
  });

  function paidSession(id: string, userId: string, courseId = ids.course): Stripe.Checkout.Session {
    return {
      id,
      payment_status: "paid",
      payment_intent: `pi_${id}`,
      amount_total: 4407,
      currency: "cad",
      total_details: { amount_tax: 507 },
      metadata: { userId, courseId, tierId: ids.tier, locale: "en", siteUrl: "https://example.test" },
    } as unknown as Stripe.Checkout.Session;
  }

  it("lets nobody watch a paid lesson without a purchase, but everyone a preview", async () => {
    expect(await getPlayableLesson(ids.alice, false, ids.lesson)).toBeNull();
    expect(await getPlayableLesson(ids.alice, false, ids.preview)).toMatchObject({ videoId: "bbbbbbbbbbb", purchaseId: null });
    expect(await getPlayableLesson(ids.alice, true, ids.lesson)).toMatchObject({ videoId: "aaaaaaaaaaa", purchaseId: null });
  });

  it("gives access only to the buyer, only for the bought course", async () => {
    expect(await fulfillCheckoutSession(paidSession("cs_1", ids.alice))).toBe(true);

    const alice = await getPlayableLesson(ids.alice, false, ids.lesson);
    expect(alice?.videoId).toBe("aaaaaaaaaaa");
    expect(alice?.purchaseId).toBeTruthy();
    // Alice bought Samba, not Rumba.
    expect(await getPlayableLesson(ids.alice, false, ids.otherLesson)).toBeNull();
    // Bob bought nothing.
    expect(await getPlayableLesson(ids.bob, false, ids.lesson)).toBeNull();
    expect(await getPurchase(ids.bob, ids.course)).toBeUndefined();

    const bobLibrary = await getLibrary(ids.bob, false);
    expect(bobLibrary.courses).toEqual([]);
    const aliceLibrary = await getLibrary(ids.alice, false);
    expect(aliceLibrary.courses.map((c) => c.id)).toEqual([ids.course]);
    // Video ids are never in the library payload; they come from playLesson only.
    expect(JSON.stringify(aliceLibrary)).not.toContain("aaaaaaaaaaa");
  });

  it("ignores unpaid sessions and sessions without our metadata", async () => {
    const unpaid = { ...paidSession("cs_2", ids.alice), payment_status: "unpaid" } as Stripe.Checkout.Session;
    expect(await fulfillCheckoutSession(unpaid)).toBe(false);
    expect(await fulfillCheckoutSession({ ...paidSession("cs_3", ids.alice), metadata: {} } as Stripe.Checkout.Session)).toBe(false);
    expect(await getPurchase(ids.alice, ids.course)).toBeUndefined();
  });

  it("fulfils the same session once, keeping the first play", async () => {
    await fulfillCheckoutSession(paidSession("cs_4", ids.alice));
    const [first] = await db.select().from(purchase).where(eq(purchase.userId, ids.alice));
    await db.update(purchase).set({ firstWatchedAt: new Date("2026-01-01") }).where(eq(purchase.id, first.id));
    await fulfillCheckoutSession(paidSession("cs_4", ids.alice));
    const [again] = await db.select().from(purchase).where(eq(purchase.userId, ids.alice));
    expect(again.id).toBe(first.id);
    expect(again.firstWatchedAt).toEqual(new Date("2026-01-01"));
  });

  it("ends access on a full refund or dispute and keeps the sale on record", async () => {
    await fulfillCheckoutSession(paidSession("cs_5", ids.alice));
    await revokePayment("pi_cs_5", "refunded");
    expect(await getPlayableLesson(ids.alice, false, ids.lesson)).toBeNull();
    expect(await getPurchase(ids.alice, ids.course)).toBeUndefined();
    const [row] = await db.select().from(purchase).where(eq(purchase.userId, ids.alice));
    expect(row.status).toBe("refunded");
    expect(row.amountCents).toBe(4407);
    expect((await getLibrary(ids.alice, false)).courses).toEqual([]);

    // A chargeback the business wins restores access.
    await fulfillCheckoutSession(paidSession("cs_6", ids.alice));
    await revokePayment("pi_cs_6", "disputed");
    expect(await getPlayableLesson(ids.alice, false, ids.lesson)).toBeNull();
    await restoreDisputedPayment("pi_cs_6");
    expect(await getPlayableLesson(ids.alice, false, ids.lesson)).not.toBeNull();
  });

  it("hides expired purchases", async () => {
    await db.insert(purchase).values({
      id: "test-expired",
      userId: ids.alice,
      courseId: ids.course,
      source: "admin",
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(await getPlayableLesson(ids.alice, false, ids.lesson)).toBeNull();
  });

  it("counts requests per key within a window", async () => {
    const limits = { max: 2, windowSeconds: 60 };
    expect((await consumeRateLimit("test:key", limits)).allowed).toBe(true);
    expect((await consumeRateLimit("test:key", limits)).allowed).toBe(true);
    expect((await consumeRateLimit("test:key", limits)).allowed).toBe(false);
    await db.update(rateLimit).set({ lastRequest: Date.now() - 61_000 }).where(eq(rateLimit.key, "test:key"));
    expect((await consumeRateLimit("test:key", limits)).allowed).toBe(true);
  });
});
