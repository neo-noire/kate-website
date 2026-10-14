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
import { type CheckoutMetadata, getHstTaxRateId, getStripe, isStripeConfigured } from "@/lib/stripe/server";

/** Set when Stripe couldn't start the payment, so the dialog can say so. */
export type CheckoutState = { failed: boolean };

/** The site's own origin, from the request, for Stripe's return links. */
async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Sends the student to Stripe Checkout for one course at one tier. The price is the tier's price
 * before tax; Stripe adds 13% HST on top. Visitors who aren't signed in go to sign-in first,
 * and students who already own the course go to their dashboard.
 */
export async function startCheckout(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  const lang = String(form.get("locale"));
  const locale = hasLocale(routing.locales, lang) ? lang : routing.defaultLocale;
  const tierId = String(form.get("tierId"));
  const courseId = String(form.get("courseId"));

  const row = await db
    .select({
      tierId: tier.id,
      tierName: tier.name,
      priceCents: tier.priceCents,
      currency: tier.currency,
      programSlug: program.slug,
      programTitle: program.title,
      courseSlug: course.slug,
      courseTitle: course.title,
    })
    .from(tier)
    .innerJoin(program, eq(program.id, tier.programId))
    .innerJoin(course, and(eq(course.programId, program.id), eq(course.id, courseId)))
    .where(and(eq(tier.id, tierId), eq(program.published, true)))
    .then((rows) => rows[0]);
  if (!row) return redirect({ href: "/", locale });

  const pagePath = `/programs/${row.programSlug}/${row.courseSlug}`;
  if (!isStripeConfigured()) return redirect({ href: pagePath, locale });

  const session = await getSession();
  if (!session) return redirect({ href: { pathname: "/sign-in", query: { next: pagePath } }, locale });
  if (await getPurchase(session.user.id, courseId)) {
    return redirect({ href: { pathname: "/dashboard", query: { course: courseId } }, locale });
  }

  const site = await origin();
  const metadata: CheckoutMetadata = { userId: session.user.id, courseId, tierId: row.tierId };
  let url: string | null;
  try {
    const checkout = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: session.user.email,
      client_reference_id: session.user.id,
      metadata,
      payment_intent_data: { metadata },
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
  } catch (error) {
    console.error("Stripe checkout failed", error);
    return { failed: true };
  }
  if (!url) return { failed: true };
  redirectExternal(url);
}
