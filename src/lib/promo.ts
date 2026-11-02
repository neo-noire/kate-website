import "server-only";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { promoCode, promoCodeProgram, promoRedemption } from "@/db/schema";

/** Why a code can't be used. The checkout dialog shows a message for each. */
export type PromoProblem = "invalid" | "notStarted" | "expired" | "usedUp" | "alreadyUsed" | "notForCourse";

export type Promo = typeof promoCode.$inferSelect;

/** The database, or a transaction on it. */
type Db = Pick<typeof db, "select" | "update" | "insert">;

/** Codes are stored uppercase and matched without regard to case. */
export const normalizePromoCode = (input: string) => input.trim().toUpperCase();

/** What a code takes off a price (before tax). Never more than the price. */
export function promoDiscount(promo: Pick<Promo, "percentOff" | "amountOffCents">, priceCents: number) {
  const off = promo.percentOff != null ? Math.round((priceCents * promo.percentOff) / 100) : (promo.amountOffCents ?? 0);
  return Math.min(Math.max(off, 0), priceCents);
}

export type PromoTarget = {
  programId: string;
  /** Currency and price of the tier being bought. */
  currency: string;
  priceCents: number;
  /** Signed-in student; without one the per-student limit isn't checked. */
  userId?: string;
};

export type PromoCheck = { promo: Promo; discountCents: number } | { problem: PromoProblem };

/** Checks a code against a purchase without using it up. */
export async function checkPromo(rawCode: string, target: PromoTarget, executor: Db = db): Promise<PromoCheck> {
  const code = normalizePromoCode(rawCode);
  if (!code) return { problem: "invalid" };
  const [promo] = await executor.select().from(promoCode).where(eq(promoCode.code, code));
  if (!promo || !promo.active) return { problem: "invalid" };

  const now = new Date();
  if (promo.startsAt && promo.startsAt > now) return { problem: "notStarted" };
  if (promo.expiresAt && promo.expiresAt <= now) return { problem: "expired" };

  if (!promo.allPrograms) {
    const [covered] = await executor
      .select({ programId: promoCodeProgram.programId })
      .from(promoCodeProgram)
      .where(and(eq(promoCodeProgram.promoCodeId, promo.id), eq(promoCodeProgram.programId, target.programId)));
    if (!covered) return { problem: "notForCourse" };
  }
  // A fixed amount is in one currency, so it can't be taken off a price in another.
  if (promo.amountOffCents != null && promo.currency !== target.currency) return { problem: "notForCourse" };

  const taken = ne(promoRedemption.status, "released");
  if (promo.maxRedemptions != null) {
    const [{ total }] = await executor
      .select({ total: count() })
      .from(promoRedemption)
      .where(and(eq(promoRedemption.promoCodeId, promo.id), taken));
    if (total >= promo.maxRedemptions) return { problem: "usedUp" };
  }
  if (target.userId) {
    const [{ mine }] = await executor
      .select({ mine: count() })
      .from(promoRedemption)
      .where(and(eq(promoRedemption.promoCodeId, promo.id), eq(promoRedemption.userId, target.userId), taken));
    if (mine >= promo.perUserLimit) return { problem: "alreadyUsed" };
  }

  return { promo, discountCents: promoDiscount(promo, target.priceCents) };
}

/**
 * Checks a code and reserves one use of it, atomically: the code's row is locked, so two students
 * can't both take the last use. The student's own earlier unpaid attempt at this course is released
 * first, so retrying checkout doesn't count against their limit.
 */
export async function reservePromo(rawCode: string, target: PromoTarget & { userId: string; courseId: string }) {
  return db.transaction(async (tx) => {
    const [locked] = await tx
      .select({ id: promoCode.id })
      .from(promoCode)
      .where(eq(promoCode.code, normalizePromoCode(rawCode)))
      .for("update");
    if (!locked) return { problem: "invalid" as const };

    await tx
      .update(promoRedemption)
      .set({ status: "released" })
      .where(
        and(
          eq(promoRedemption.userId, target.userId),
          eq(promoRedemption.courseId, target.courseId),
          eq(promoRedemption.status, "reserved"),
        ),
      );

    const result = await checkPromo(rawCode, target, tx);
    if ("problem" in result) return result;

    const redemptionId = crypto.randomUUID();
    await tx.insert(promoRedemption).values({
      id: redemptionId,
      promoCodeId: result.promo.id,
      userId: target.userId,
      courseId: target.courseId,
      discountCents: result.discountCents,
    });
    return { ...result, redemptionId };
  });
}

export async function attachSessionToRedemption(redemptionId: string, checkoutSessionId: string) {
  await db.update(promoRedemption).set({ checkoutSessionId }).where(eq(promoRedemption.id, redemptionId));
}

export async function releaseRedemption(redemptionId: string) {
  await db.update(promoRedemption).set({ status: "released" }).where(eq(promoRedemption.id, redemptionId));
}

/** The payment went through: the reserved use becomes a real one. */
export async function markRedeemed(checkoutSessionId: string) {
  await db
    .update(promoRedemption)
    .set({ status: "redeemed" })
    .where(and(eq(promoRedemption.checkoutSessionId, checkoutSessionId), ne(promoRedemption.status, "redeemed")));
}

/** The checkout expired or failed: the use is free again. */
export async function releaseBySession(checkoutSessionId: string) {
  await db
    .update(promoRedemption)
    .set({ status: "released" })
    .where(and(eq(promoRedemption.checkoutSessionId, checkoutSessionId), eq(promoRedemption.status, "reserved")));
}
