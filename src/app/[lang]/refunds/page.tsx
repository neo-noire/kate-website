import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal-page";
import { getLegalDocument } from "@/content/legal";
import { localeAlternates } from "@/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: getLegalDocument(locale, "refunds").title, alternates: localeAlternates(locale, "/refunds") };
}

export default function Page() {
  return <LegalPage doc="refunds" />;
}
