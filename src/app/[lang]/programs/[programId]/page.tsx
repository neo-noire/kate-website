import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackagePicker } from "@/components/package-picker";
import { getProgram, programs } from "@/content/catalog";
import { localeAlternates } from "@/i18n/metadata";
import { getLocale } from "next-intl/server";

export function generateStaticParams() {
  return programs.map((program) => ({ programId: program.id }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/programs/[programId]">): Promise<Metadata> {
  const { programId } = await params;
  const program = getProgram(programId);
  if (!program) return {};
  return { title: program.name, alternates: localeAlternates(await getLocale(), `/programs/${program.id}`) };
}

/** A program opens on its first dance. */
export default async function ProgramPage({ params }: PageProps<"/[lang]/programs/[programId]">) {
  const { programId } = await params;
  const program = getProgram(programId);
  if (!program) notFound();
  return <PackagePicker program={program} danceId={program.danceIds[0]} />;
}
