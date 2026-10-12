import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProgramView } from "@/components/program-view";
import { localeAlternates } from "@/i18n/metadata";
import { getProgramPage } from "@/lib/catalog/queries";
import { localize } from "@/lib/localized";

export async function generateMetadata({ params }: PageProps<"/[lang]/programs/[program]">): Promise<Metadata> {
  const { program } = await params;
  const page = await getProgramPage(program);
  if (!page) return {};
  const locale = await getLocale();
  return { title: localize(page.title, locale), alternates: localeAlternates(locale, `/programs/${page.slug}`) };
}

/** A program opens on its first dance. */
export default function ProgramPage({ params }: PageProps<"/[lang]/programs/[program]">) {
  return (
    <Suspense fallback={<main className="section wrap packagesPage" style={{ minHeight: "60vh" }} />}>
      <ProgramRoute params={params} />
    </Suspense>
  );
}

async function ProgramRoute({ params }: Pick<PageProps<"/[lang]/programs/[program]">, "params">) {
  const { program } = await params;
  const page = await getProgramPage(program);
  if (!page) notFound();
  return <ProgramView page={page} course={page.courses[0]} />;
}
