import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard";
import { localeAlternates } from "@/i18n/metadata";
import { redirect } from "@/i18n/navigation";
import { getSession, isAdmin } from "@/lib/auth/session";
import { getLibrary } from "@/lib/catalog/queries";
import { fulfillCheckoutSession, getStripe, isStripeConfigured } from "@/lib/stripe/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return {
    title: t("myDances"),
    alternates: localeAlternates(await getLocale(), "/dashboard"),
    // A personal page; keep it out of search results.
    robots: { index: false },
  };
}

/** Student dashboard, for signed-in students only. */
export default function DashboardPage({ searchParams }: PageProps<"/[lang]/dashboard">) {
  return (
    <Suspense fallback={<main className="section wrap" style={{ minHeight: "60vh" }} />}>
      <SignedInDashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function SignedInDashboard({ searchParams }: Pick<PageProps<"/[lang]/dashboard">, "searchParams">) {
  const locale = await getLocale();
  const session = await getSession();
  // The proxy already redirects visitors without a session cookie; this also covers expired
  // or revoked sessions.
  if (!session) return redirect({ href: { pathname: "/sign-in", query: { next: "/dashboard" } }, locale });
  const admin = isAdmin(session.user);
  const { course, checkout } = await searchParams;
  // Back from Stripe: unlock the course now rather than waiting for the webhook.
  const checkoutStatus = typeof checkout === "string" ? await completeCheckout(checkout, session.user.id) : undefined;
  const library = await getLibrary(session.user.id, admin);
  return (
    <Dashboard
      userName={session.user.name}
      admin={admin}
      library={library}
      initialCourseId={typeof course === "string" ? course : undefined}
      checkout={checkoutStatus}
    />
  );
}

/** Fulfills the student's own Checkout Session if it is paid; "pending" while the payment clears. */
async function completeCheckout(sessionId: string, userId: string) {
  if (!sessionId.startsWith("cs_") || !isStripeConfigured()) return undefined;
  const checkout = await getStripe().checkout.sessions.retrieve(sessionId).catch(() => null);
  if (!checkout || checkout.metadata?.userId !== userId) return undefined;
  return (await fulfillCheckoutSession(checkout)) ? "paid" : "pending";
}
