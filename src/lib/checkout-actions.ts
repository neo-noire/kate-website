"use server";

import { and, eq } from "drizzle-orm";
import { hasLocale } from "next-intl";
import { headers } from "next/headers";
import { redirect as redirectExternal } from "next/navigation";
import { db } from "@/db";
import { course, program, tier } from "@/db/schema";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getSession } from "@/lib/auth/session";
import { getPurchase } from "@/lib/catalog/queries";
import { localize } from "@/lib/localized";
import { withHst } from "@/lib/money";
import {
  attachSessionToRedemption,
  checkPromo,
  normalizePromoCode,
  releaseRedemption,
  reservePromo,
  type PromoProblem,
} from "@/lib/promo";
import { type CheckoutMetadata, getHstTaxRateId, getStripe, isStripeConfigured } from "@/lib/stripe/server";

/** Set when Stripe couldn't start the payment, or the promo code couldn't be used, so the dialog can say so. */
export type CheckoutState = { failed: boolean; promoProblem?: PromoProblem };

/** What the dialog shows after "Apply": the price with the code taken off, or why the code can't be used. */
export type PromoPreview = {
  code?: string;
  problem?: PromoProblem;
  currency?: string;
  discountCents?: number;
  beforeTaxCents?: number;
  hstCents?: number;
  totalCents?: number;
  at?: number;
};

/** The site's own origin, from the request, for Stripe's return links. */
async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function readLocale(form: FormData) {
  const lang = String(form.get("locale"));
  return hasLocale(routing.locales, lang) ? lang : routing.defaultLocale;
}

/** The tier and course being bought, if they belong to a published program. */
async function loadPurchase(tierId: string, courseId: string) {
  return db
    .select({
      tierId: tier.id,
      tierName: tier.name,
      priceCents: tier.priceCents,
      currency: tier.currency,
      programId: program.id,
      programSlug: program.slug,
      programTitle: program.title,
      courseSlug: course.slug,
      courseTitle: course.title,
    })
    .from(tier)
    .innerJoin(program, eq(program.id, tier.programId))
    .innerJoin(course, and(eq(course.programId, program.id), eq(course.id, courseId)))
    .where(and(eq(tier.id, tierId), eq(program.status, "published")))
    .then((rows) => rows[0]);
}

/** Price after a promo code, with HST on what is left. */
function discountedPrice(priceCents: number, discountCents: number) {
  return withHst(priceCents - discountCents);
}

/** Checks a promo code for the dialog, so the student sees the new price before paying. Reserves nothing. */
export async function previewPromo(_: PromoPreview, form: FormData): Promise<PromoPreview> {
  const at = Date.now();
  const row = await loadPurchase(String(form.get("tierId")), String(form.get("courseId")));
  const code = normalizePromoCode(String(form.get("promo") ?? ""));
  if (!code) return { at };
  if (!row) return { problem: "invalid", at };

  const session = await getSession();
  const result = await checkPromo(code, {
    programId: row.programId,
    currency: row.currency,
    priceCents: row.priceCents,
    userId: session?.user.id,
  });
  if ("problem" in result) return { problem: result.problem, at };

  const { beforeTax, hst, total } = discountedPrice(row.priceCents, result.discountCents);
  return {
    code,
    currency: row.currency,
    discountCents: result.discountCents,
    beforeTaxCents: beforeTax,
    hstCents: hst,
    totalCents: total,
    at,
  };
}

/**
 * Sends the student to Stripe Checkout for one course at one tier. The price is the tier's price
 * before tax, less any promo code; Stripe adds 13% HST on what is left. Visitors who aren't signed in
 * go to sign-in first, and students who already own the course go to their dashboard.
 */
export async function startCheckout(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  const locale = readLocale(form);
  const courseId = String(form.get("courseId"));
  const promoInput = normalizePromoCode(String(form.get("promo") ?? ""));

  const row = await loadPurchase(String(form.get("tierId")), courseId);
  if (!row) return redirect({ href: "/", locale });

  const pagePath = `/programs/${row.programSlug}/${row.courseSlug}`;
  if (!isStripeConfigured()) return redirect({ href: pagePath, locale });

  const session = await getSession();
  if (!session) return redirect({ href: { pathname: "/sign-in", query: { next: pagePath } }, locale });
  if (await getPurchase(session.user.id, courseId)) {
    return redirect({ href: { pathname: "/dashboard", query: { course: courseId } }, locale });
  }

  // Reserve the code first, so a paid checkout can't end up over the code's limit.
  let promo: { code: string; discountCents: number; redemptionId: string } | null = null;
  if (promoInput) {
    const reserved = await reservePromo(promoInput, {
      programId: row.programId,
      currency: row.currency,
      priceCents: row.priceCents,
      userId: session.user.id,
      courseId,
    });
    if ("problem" in reserved) return { failed: false, promoProblem: reserved.problem };
    promo = { code: promoInput, discountCents: reserved.discountCents, redemptionId: reserved.redemptionId };
  }

  const site = await origin();
  const metadata: CheckoutMetadata = { userId: session.user.id, courseId, tierId: row.tierId };
  let url: string | null;
  try {
    const stripe = getStripe();
    const coupon = promo
      ? await stripe.coupons.create({
          name: promo.code,
          amount_off: promo.discountCents,
          currency: row.currency.toLowerCase(),
          duration: "once",
          max_redemptions: 1,
        })
      : null;
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: session.user.email,
      client_reference_id: session.user.id,
      metadata: promo ? { ...metadata, promo: promo.code } : metadata,
      payment_intent_data: { metadata },
      ...(coupon ? { discounts: [{ coupon: coupon.id }] } : {}),
      // A reserved promo use is held until the session ends, so a promo checkout expires after the minimum 30 minutes.
      ...(promo ? { expires_at: Math.floor(Date.now() / 1000) + 30 * 60 } : {}),
      line_items: [
        {
          quantity: 1,
          tax_rates: [await getHstTaxRateId()],
          price_data: {
            currency: row.currency.toLowerCase(),
            unit_amount: row.priceCents,
            product_data: {
              name: `${localize(row.courseTitle, locale)} · ${localize(row.tierName, locale)}`,
              description: localize(row.programTitle, locale) || undefined,
            },
          },
        },
      ],
      locale: "auto",
      success_url: `${site}/${locale}/dashboard?course=${courseId}&checkout={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/${locale}${pagePath}`,
    });
    url = checkout.url;
    if (promo) await attachSessionToRedemption(promo.redemptionId, checkout.id);
  } catch (error) {
    console.error("Stripe checkout failed", error);
    if (promo) await releaseRedemption(promo.redemptionId);
    return { failed: true };
  }
  if (!url) {
    if (promo) await releaseRedemption(promo.redemptionId);
    return { failed: true };
  }
  redirectExternal(url);
}
