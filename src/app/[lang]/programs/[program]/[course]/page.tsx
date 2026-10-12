import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProgramView } from "@/components/program-view";
import { localeAlternates } from "@/i18n/metadata";
import { getProgramPage } from "@/lib/catalog/queries";
import { localize } from "@/lib/localized";

type Props = PageProps<"/[lang]/programs/[program]/[course]">;

async function resolve(params: Props["params"]) {
  const { program, course } = await params;
  const page = await getProgramPage(program);
  const selected = page?.courses.find((c) => c.slug === course);
  return page && selected ? { page, course: selected } : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const route = await resolve(params);
  if (!route) return {};
  const locale = await getLocale();
  return {
    title: `${localize(route.course.title, locale)} · ${localize(route.page.title, locale)}`,
    alternates: localeAlternates(locale, `/programs/${route.page.slug}/${route.course.slug}`),
  };
}

export default function ProgramCoursePage({ params }: Props) {
  return (
    <Suspense fallback={<main className="section wrap packagesPage" style={{ minHeight: "60vh" }} />}>
      <CourseRoute params={params} />
    </Suspense>
  );
}

async function CourseRoute({ params }: Pick<Props, "params">) {
  const route = await resolve(params);
  if (!route) notFound();
  return <ProgramView page={route.page} course={route.course} />;
}
