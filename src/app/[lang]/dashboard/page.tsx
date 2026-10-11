import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";
import { localeAlternates } from "@/i18n/metadata";
import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return {
    title: t("myDances"),
    alternates: localeAlternates(await getLocale(), "/dashboard"),
    // A personal page; keep it out of search results.
    robots: { index: false },
  };
}

/** Demo student dashboard. All data comes from this browser's localStorage. */
export default function DashboardPage() {
  return <Dashboard />;
}
