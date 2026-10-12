import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard";
import { localeAlternates } from "@/i18n/metadata";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth/server";

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
export default function DashboardPage() {
  return (
    <Suspense fallback={<main className="section wrap" style={{ minHeight: "60vh" }} />}>
      <SignedInDashboard />
    </Suspense>
  );
}

async function SignedInDashboard() {
  const locale = await getLocale();
  const session = await auth.api.getSession({ headers: await headers() });
  // The proxy already redirects visitors without a session cookie; this also covers expired
  // or revoked sessions.
  if (!session) return redirect({ href: { pathname: "/sign-in", query: { next: "/dashboard" } }, locale });
  return <Dashboard userName={session.user.name} />;
}
