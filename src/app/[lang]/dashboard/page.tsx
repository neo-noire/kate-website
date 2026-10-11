import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";
import { localeAlternates } from "@/i18n/metadata";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getDictionary();
  return {
    title: dict.dashboard.myDances,
    alternates: localeAlternates(locale, "/dashboard"),
    // A personal page; keep it out of search results.
    robots: { index: false },
  };
}

/** Demo student dashboard. All data comes from this browser's localStorage. */
export default function DashboardPage() {
  return <Dashboard />;
}
