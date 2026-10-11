import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackagePicker } from "@/components/package-picker";
import { dances, getProgram, programHasDance, programs } from "@/content/catalog";
import { localeAlternates } from "@/i18n/metadata";
import { getLocale } from "next-intl/server";

export function generateStaticParams() {
  return programs.flatMap((program) => program.danceIds.map((danceId) => ({ programId: program.id, danceId })));
}

async function resolve(params: PageProps<"/[lang]/programs/[programId]/[danceId]">["params"]) {
  const { programId, danceId } = await params;
  const program = getProgram(programId);
  if (!program || !programHasDance(program, danceId)) return undefined;
  return { program, danceId };
}

export async function generateMetadata({ params }: PageProps<"/[lang]/programs/[programId]/[danceId]">): Promise<Metadata> {
  const route = await resolve(params);
  if (!route) return {};
  return {
    title: `${dances[route.danceId].name} · ${route.program.name}`,
    alternates: localeAlternates(await getLocale(), `/programs/${route.program.id}/${route.danceId}`),
  };
}

export default async function ProgramDancePage({ params }: PageProps<"/[lang]/programs/[programId]/[danceId]">) {
  const route = await resolve(params);
  if (!route) notFound();
  return <PackagePicker program={route.program} danceId={route.danceId} />;
}
