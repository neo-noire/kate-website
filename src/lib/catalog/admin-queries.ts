import "server-only";
import { asc, count, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  account,
  contactMessage,
  course,
  lesson,
  newsletterSubscriber,
  program,
  promoCode,
  promoCodeProgram,
  promoRedemption,
  purchase,
  session,
  tier,
  user,
} from "@/db/schema";

// Admin reads are not cached: they include drafts and must show edits immediately.

export async function getAdminPrograms() {
  return db.query.program.findMany({
    orderBy: [asc(program.sortOrder), asc(program.createdAt)],
    columns: { id: true, slug: true, title: true, status: true },
    with: { courses: { columns: { id: true } }, tiers: { columns: { id: true } } },
  });
}

/** A program with everything the editor shows, including who has access to its courses. */
export async function getAdminProgram(id: string) {
  const row = await db.query.program.findFirst({
    where: eq(program.id, id),
    with: {
      courses: {
        orderBy: [asc(course.sortOrder), asc(course.createdAt)],
        with: { lessons: { orderBy: [asc(lesson.sortOrder), asc(lesson.createdAt)] } },
      },
      tiers: { orderBy: [asc(tier.sortOrder), asc(tier.createdAt)] },
    },
  });
  if (!row) return null;

  const courseIds = row.courses.map((c) => c.id);
  const purchases = courseIds.length
    ? await db.query.purchase.findMany({
        where: inArray(purchase.courseId, courseIds),
        orderBy: [desc(purchase.createdAt)],
        columns: { id: true, courseId: true, source: true, status: true, expiresAt: true, firstWatchedAt: true, revokedAt: true },
        with: { user: { columns: { name: true, email: true } }, tier: { columns: { name: true } } },
      })
    : [];
  return { ...row, purchases };
}

export type AdminProgram = NonNullable<Awaited<ReturnType<typeof getAdminProgram>>>;

/** The newest messages from the contact form. */
export async function getContactMessages(limit = 100) {
  return db.query.contactMessage.findMany({ orderBy: [desc(contactMessage.createdAt)], limit });
}

/** Accounts promoted to admin from the admin page. Admins named in ADMIN_EMAILS are not in the database. */
export async function getAdminUsers() {
  return db.query.user.findMany({ where: eq(user.role, "admin"), columns: { id: true, name: true, email: true }, orderBy: [asc(user.createdAt)] });
}

export async function getNewsletterSubscribers() {
  return db.query.newsletterSubscriber.findMany({ orderBy: [desc(newsletterSubscriber.createdAt)] });
}

/** Every promo code with the programs it covers and how many times it has been used (or is being used). */
export async function getAdminPromoCodes() {
  const [codes, links, usage] = await Promise.all([
    db.select().from(promoCode).orderBy(desc(promoCode.createdAt)),
    db.select({ promoCodeId: promoCodeProgram.promoCodeId, programId: promoCodeProgram.programId }).from(promoCodeProgram),
    db
      .select({ promoCodeId: promoRedemption.promoCodeId, used: count() })
      .from(promoRedemption)
      .where(ne(promoRedemption.status, "released"))
      .groupBy(promoRedemption.promoCodeId),
  ]);
  const used = new Map(usage.map((row) => [row.promoCodeId, row.used]));
  return codes.map((code) => ({
    ...code,
    programIds: links.filter((link) => link.promoCodeId === code.id).map((link) => link.programId),
    used: used.get(code.id) ?? 0,
  }));
}

export type AdminPromoCode = Awaited<ReturnType<typeof getAdminPromoCodes>>[number];

export const USERS_PAGE_SIZE = 25;

/** One page of accounts, newest first, optionally filtered by a piece of the name or email. */
export async function getUsersPage(query: string, page: number) {
  // % and _ are wildcards in LIKE; a search for them should match them literally.
  const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
  const where = query ? or(ilike(user.email, pattern), ilike(user.name, pattern)) : undefined;
  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        deactivatedAt: user.deactivatedAt,
        deletedAt: user.deletedAt,
        purchases: sql<number>`(select count(*)::int from ${purchase} where ${purchase.userId} = ${user.id})`,
        providers: sql<string[]>`coalesce((select array_agg(distinct ${account.providerId}) from ${account} where ${account.userId} = ${user.id}), '{}')`,
      })
      .from(user)
      .where(where)
      .orderBy(desc(user.createdAt))
      .limit(USERS_PAGE_SIZE)
      .offset((page - 1) * USERS_PAGE_SIZE),
    db.select({ count: count() }).from(user).where(where),
  ]);
  return { rows, total: total.count };
}

/** Everything the admin sees about one account. Never includes password hashes or tokens. */
export async function getUserDetail(id: string) {
  const row = await db.query.user.findFirst({
    where: eq(user.id, id),
    columns: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
      deactivatedAt: true,
      deactivationReason: true,
      deletedAt: true,
    },
  });
  if (!row) return null;
  const [providers, purchases, sessions, messages, redemptions] = await Promise.all([
    db.select({ provider: account.providerId }).from(account).where(eq(account.userId, id)),
    db.query.purchase.findMany({
      where: eq(purchase.userId, id),
      columns: { id: true, source: true, status: true, amountCents: true, currency: true, expiresAt: true, createdAt: true },
      with: { course: { columns: { title: true } }, tier: { columns: { name: true } } },
      orderBy: [desc(purchase.createdAt)],
    }),
    db
      .select({ id: session.id, createdAt: session.createdAt, expiresAt: session.expiresAt, ipAddress: session.ipAddress, userAgent: session.userAgent })
      .from(session)
      .where(eq(session.userId, id))
      .orderBy(desc(session.createdAt))
      .limit(5),
    db
      .select({ id: contactMessage.id, message: contactMessage.message, createdAt: contactMessage.createdAt })
      .from(contactMessage)
      .where(or(eq(contactMessage.userId, id), eq(contactMessage.email, row.email)))
      .orderBy(desc(contactMessage.createdAt))
      .limit(10),
    db
      .select({ code: promoCode.code, discountCents: promoRedemption.discountCents, status: promoRedemption.status, createdAt: promoRedemption.createdAt })
      .from(promoRedemption)
      .innerJoin(promoCode, eq(promoCode.id, promoRedemption.promoCodeId))
      .where(eq(promoRedemption.userId, id))
      .orderBy(desc(promoRedemption.createdAt)),
  ]);
  return { ...row, providers: providers.map((p) => p.provider), purchases, sessions, messages, redemptions };
}

export type AdminUserRow = Awaited<ReturnType<typeof getUsersPage>>["rows"][number];
export type AdminUserDetail = NonNullable<Awaited<ReturnType<typeof getUserDetail>>>;
