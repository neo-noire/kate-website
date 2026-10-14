import "server-only";
import { and, eq, sql } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/db";
import { purchase } from "@/db/schema";
import { accessExpiry } from "@/lib/catalog/access";
import { HST_RATE } from "@/lib/money";

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
export type CheckoutMetadata = { userId: string; courseId: string; tierId: string };

/**
 * Gives the student access for a paid Checkout Session. Runs from the webhook and from the
 * success page, whichever comes first; the second run changes nothing.
 * Returns false when the session isn't paid (yet) or isn't one of ours.
 */
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  const { userId, courseId, tierId } = (session.metadata ?? {}) as Partial<CheckoutMetadata>;
  if (session.payment_status !== "paid" || !userId || !courseId) return false;
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);
  const paid = {
    tierId: tierId || null,
    source: "stripe",
    expiresAt: accessExpiry(),
    // A new purchase starts a new refund window.
    firstWatchedAt: null,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    amountCents: session.amount_total,
    taxCents: session.total_details?.amount_tax ?? null,
    currency: session.currency?.toUpperCase() ?? null,
  };
  await db
    .insert(purchase)
    .values({ id: crypto.randomUUID(), userId, courseId, ...paid })
    .onConflictDoUpdate({
      target: [purchase.userId, purchase.courseId],
      set: { ...paid, updatedAt: new Date() },
      // Already fulfilled for this session: keep the record (and any first play) as it is.
      setWhere: sql`${purchase.stripeCheckoutSessionId} is distinct from ${session.id}`,
    });
  return true;
}

/** Ends access bought with a payment that was fully refunded in Stripe. */
export async function revokeRefundedPayment(paymentIntentId: string) {
  await db
    .delete(purchase)
    .where(and(eq(purchase.source, "stripe"), eq(purchase.stripePaymentIntentId, paymentIntentId)));
}
