import "server-only";
import { and, eq, sql } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/db";
import { course, program, purchase, tier, user } from "@/db/schema";
import { accessExpiry } from "@/lib/catalog/access";
import { sendEmailQuietly } from "@/lib/email";
import { emailLocale, purchaseEmail } from "@/lib/emails";
import { localize } from "@/lib/localized";
import { HST_RATE } from "@/lib/money";
import { markRedeemed } from "@/lib/promo";

/** Settings Stripe needs, as named in Vercel. Checkout is off until all of them are set. */
export const STRIPE_ENV = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] as const;

/** The Stripe settings that aren't set yet; empty when online payment is on. */
export function missingStripeEnv() {
  return STRIPE_ENV.filter((name) => !process.env[name]);
}

export function isStripeConfigured() {
  return missingStripeEnv().length === 0;
}

let client: Stripe | undefined;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(key);
  return client;
}

/** Marks the HST tax rate this site creates in Stripe, so it is found again instead of duplicated. */
const HST_RATE_KEY = "ontario-hst";
let hstRateId: string | undefined;

/**
 * The Stripe tax rate for 13% Ontario HST, added on top of the price (not included in it).
 * Created in the Stripe account on first use, so the only setup is the API keys.
 */
export async function getHstTaxRateId() {
  if (hstRateId) return hstRateId;
  const stripe = getStripe();
  const percentage = HST_RATE * 100;
  for await (const rate of stripe.taxRates.list({ active: true, limit: 100 })) {
    if (rate.metadata?.site === HST_RATE_KEY && rate.percentage === percentage && !rate.inclusive) {
      return (hstRateId = rate.id);
    }
  }
  const rate = await stripe.taxRates.create({
    display_name: "HST",
    description: "Ontario HST",
    percentage,
    inclusive: false,
    country: "CA",
    state: "ON",
    jurisdiction: "Ontario",
    tax_type: "hst",
    metadata: { site: HST_RATE_KEY },
  });
  return (hstRateId = rate.id);
}

/** What checkout stores on the session, read back when it is paid. */
export type CheckoutMetadata = { userId: string; courseId: string; tierId: string; locale: string; siteUrl: string };

/**
 * Gives the student access for a paid Checkout Session. Runs from the webhook and from the
 * success page, whichever comes first; the second run changes nothing. The first run also
 * emails the student a confirmation.
 * Returns false when the session isn't paid (yet) or isn't one of ours.
 */
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  const { userId, courseId, tierId, locale, siteUrl } = (session.metadata ?? {}) as Partial<CheckoutMetadata>;
  // A checkout discounted to zero by a promo code has nothing to pay: Stripe reports it as no_payment_required.
  const settled = session.payment_status === "paid" || session.payment_status === "no_payment_required";
  if (!settled || !userId || !courseId) return false;
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);
  const paid = {
    tierId: tierId || null,
    source: "stripe",
    status: "active" as const,
    revokedAt: null,
    expiresAt: accessExpiry(),
    // A new purchase starts a new refund window.
    firstWatchedAt: null,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    amountCents: session.amount_total,
    taxCents: session.total_details?.amount_tax ?? null,
    currency: session.currency?.toUpperCase() ?? null,
  };
  const [written] = await db
    .insert(purchase)
    .values({ id: crypto.randomUUID(), userId, courseId, ...paid })
    .onConflictDoUpdate({
      target: [purchase.userId, purchase.courseId],
      set: { ...paid, updatedAt: new Date() },
      // Already fulfilled for this session: keep the record (and any first play) as it is.
      setWhere: sql`${purchase.stripeCheckoutSessionId} is distinct from ${session.id}`,
    })
    .returning({ id: purchase.id, expiresAt: purchase.expiresAt });
  await markRedeemed(session.id);
  if (written) {
    console.info(`Fulfilled checkout ${session.id}: user ${userId}, course ${courseId}, ${session.amount_total} ${session.currency}`);
    await sendPurchaseConfirmation({ userId, courseId, tierId, locale, siteUrl, expiresAt: written.expiresAt ?? accessExpiry(), session });
  }
  return true;
}

async function sendPurchaseConfirmation({
  userId,
  courseId,
  tierId,
  locale,
  siteUrl,
  expiresAt,
  session,
}: Partial<CheckoutMetadata> & { userId: string; courseId: string; expiresAt: Date; session: Stripe.Checkout.Session }) {
  const lang = emailLocale(locale);
  const [row] = await db
    .select({ email: user.email, courseTitle: course.title, programTitle: program.title })
    .from(course)
    .innerJoin(program, eq(program.id, course.programId))
    .innerJoin(user, eq(user.id, userId))
    .where(eq(course.id, courseId));
  if (!row) return;
  const tierRow = tierId ? await db.query.tier.findFirst({ where: eq(tier.id, tierId), columns: { name: true } }) : undefined;
  await sendEmailQuietly({
    to: row.email,
    ...purchaseEmail(lang, {
      courseTitle: localize(row.courseTitle, lang),
      programTitle: localize(row.programTitle, lang),
      tierName: tierRow ? localize(tierRow.name, lang) : "",
      amountCents: session.amount_total ?? 0,
      taxCents: session.total_details?.amount_tax ?? 0,
      currency: session.currency?.toUpperCase() ?? "CAD",
      expiresAt,
      dashboardUrl: `${siteUrl ?? ""}/${lang}/dashboard?course=${courseId}`,
    }),
  });
}

/**
 * Ends access bought with a payment that was fully refunded or charged back in Stripe. The row
 * stays as the record of the sale; only "active" purchases give access.
 */
export async function revokePayment(paymentIntentId: string, reason: "refunded" | "disputed") {
  const rows = await db
    .update(purchase)
    .set({ status: reason, revokedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(purchase.source, "stripe"), eq(purchase.stripePaymentIntentId, paymentIntentId), eq(purchase.status, "active")))
    .returning({ id: purchase.id });
  if (rows.length) console.info(`Payment ${paymentIntentId} ${reason}: access ended for ${rows.length} purchase(s)`);
}

/** A dispute the business won: the payment stands, so access comes back. */
export async function restoreDisputedPayment(paymentIntentId: string) {
  await db
    .update(purchase)
    .set({ status: "active", revokedAt: null, updatedAt: new Date() })
    .where(and(eq(purchase.stripePaymentIntentId, paymentIntentId), eq(purchase.status, "disputed")));
}
