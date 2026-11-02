import { ArrowLeft, ArrowUpRight, Clock, Play, Video } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Markdown } from "@/components/markdown";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { getSession, isAdmin } from "@/lib/auth/session";
import { getPurchase, type ProgramPage } from "@/lib/catalog/queries";
import { localize, localizeLines } from "@/lib/localized";
import { formatPrice, HST_RATE, withHst } from "@/lib/money";
import { isStripeConfigured } from "@/lib/stripe/server";
import { cn } from "@/lib/utils";
import { BuyPanel, type BuyPanelTier } from "./buy-panel";
import { Expandable } from "./expandable";
import { PreviewLessonButton } from "./preview-lesson-button";

type Course = ProgramPage["courses"][number];

/** A program's dance switcher, then the selected dance's description, lesson outline and a buy panel. */
export async function ProgramView({ page, course }: { page: ProgramPage; course: Course | undefined }) {
  const [t, locale] = await Promise.all([getTranslations("packages"), getLocale()]);
  const programTitle = localize(page.title, locale);

  return (
    <main className="section wrap packagesPage">
      <Link className="backLink" href="/#courses">
        <ArrowLeft size={14} aria-hidden /> {t("back")}
      </Link>
      <div className="eyebrow">{t("eyebrow")}</div>
      <h1>{programTitle}</h1>
      <p className="sub">
        {localize(page.description, locale) ?? ""} {page.courses.length > 0 && t("summary", { count: page.courses.length })}
      </p>
      {page.courses.length > 1 && (
        <nav aria-label={programTitle} className="mt-6 mb-9 inline-flex flex-wrap gap-1 rounded-full border border-border bg-[var(--panel)] p-1">
          {page.courses.map((c) => (
            <Link
              key={c.id}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground",
                c.id === course?.id && "bg-foreground text-background hover:text-background",
              )}
              aria-current={c.id === course?.id ? "page" : undefined}
              href={`/programs/${page.slug}/${c.slug}`}
              scroll={false}
            >
              {localize(c.title, locale)}
            </Link>
          ))}
        </nav>
      )}

      {course ? (
        <div className={cn("grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12", page.courses.length <= 1 && "mt-8")}>
          <div className="min-w-0">
            <CourseIntro course={course} />
            <Lessons course={course} />
            <p className="fine mt-10">{t("fine")}</p>
          </div>
          <Tiers page={page} course={course} programTitle={programTitle} />
        </div>
      ) : (
        <p className="fine">{t("noLessons")}</p>
      )}
    </main>
  );
}

async function CourseIntro({ course }: { course: Course }) {
  const [t, locale] = await Promise.all([getTranslations("packages"), getLocale()]);
  const description = localize(course.description, locale);
  const totalMinutes = course.lessons.reduce((sum, lesson) => sum + (lesson.durationMinutes ?? 0), 0);

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-border pb-4">
        <h2 className="text-3xl font-black tracking-tight">{localize(course.title, locale)}</h2>
        <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Video size={14} aria-hidden className="text-primary" />
            {t("videoLessons", { count: course.lessons.length })}
          </span>
          {totalMinutes > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} aria-hidden className="text-primary" />
              {t("videoLength", { length: t("minutes", { minutes: totalMinutes }) })}
            </span>
          )}
        </p>
      </div>
      <div className="mt-5">
        <Suspense fallback={null}>
          <CourseAccess courseId={course.id} />
        </Suspense>
      </div>
      {description && (
        <div className="mt-5">
          <Expandable>
            <Markdown>{description}</Markdown>
          </Expandable>
        </div>
      )}
    </>
  );
}

async function Tiers({ page, course, programTitle }: { page: ProgramPage; course: Course; programTitle: string }) {
  const [t, locale] = await Promise.all([getTranslations("packages"), getLocale()]);
  if (!page.tiers.length) return <p className="fine">{t("noTiers")}</p>;

  const tiers: BuyPanelTier[] = page.tiers.map((tier) => {
    const { beforeTax, hst, total } = withHst(tier.priceCents);
    return {
      id: tier.id,
      name: localize(tier.name, locale),
      featured: tier.featured,
      price: formatPrice(total, tier.currency, locale),
      breakdown: {
        rate: HST_RATE * 100,
        hst: formatPrice(hst, tier.currency, locale),
        beforeTax: formatPrice(beforeTax, tier.currency, locale),
      },
      privateLessons: tier.privateLessons,
      items: [
        t("videoLessons", { count: course.lessons.length }),
        ...(tier.privateLessons ? [t("privateLessons", { count: tier.privateLessons, minutes: tier.privateLessonMinutes })] : []),
        ...localizeLines(tier.features, locale),
      ]
        .map((text) => ({ text, included: true }))
        .concat(localizeLines(tier.excludedFeatures, locale).map((text) => ({ text, included: false }))),
    };
  });

  return (
    <BuyPanel
      tiers={tiers}
      programTitle={programTitle}
      courseTitle={localize(course.title, locale)}
      courseId={course.id}
      lessonCount={course.lessons.length}
      paymentsEnabled={isStripeConfigured()}
    />
  );
}

async function Lessons({ course }: { course: Course }) {
  const [t, locale] = await Promise.all([getTranslations("packages"), getLocale()]);
  if (!course.lessons.length) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-2 text-[13px] font-bold tracking-[0.16em] text-muted-foreground uppercase">{t("inside")}</h2>
      <Accordion type="multiple" className="grid gap-2">
        {course.lessons.map((lesson, i) => {
          const title = localize(lesson.title, locale);
          const description = localize(lesson.description, locale);
          const summary = (
            <>
              <b className="w-6 text-[13px] text-primary tabular-nums">{String(i + 1).padStart(2, "0")}</b>
              <span className="min-w-0 flex-1 font-bold">{title}</span>
              {lesson.isPreview && (
                <Badge variant="outline" className="border-primary/50 text-red-300">
                  {t("preview")}
                </Badge>
              )}
              {lesson.durationMinutes ? (
                <span className="text-[12.5px] font-normal whitespace-nowrap text-muted-foreground tabular-nums">
                  {t("minutes", { minutes: lesson.durationMinutes })}
                </span>
              ) : null}
            </>
          );

          if (!description && !lesson.previewVideoId) {
            return (
              <div key={lesson.id} className="flex items-center gap-4 rounded-xl border border-border bg-[var(--panel)] px-4 py-3.5 text-sm">
                {summary}
                <span className="size-4 shrink-0" aria-hidden />
              </div>
            );
          }
          return (
            <AccordionItem key={lesson.id} value={lesson.id} className="rounded-xl border border-border bg-[var(--panel)] last:border-b hover:border-muted-foreground/50">
              <AccordionTrigger className="items-center gap-4 px-4 py-3.5 hover:no-underline [&>svg]:translate-y-0">{summary}</AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pl-[3.25rem]">
                {description && <Markdown className="text-muted-foreground">{description}</Markdown>}
                {lesson.previewVideoId && (
                  <PreviewLessonButton
                    videoId={lesson.previewVideoId}
                    title={title}
                    className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3.5 text-[13px] font-bold hover:border-foreground"
                  >
                    <Play size={14} aria-hidden /> {t("watchPreviewShort")}
                  </PreviewLessonButton>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </section>
  );
}

/** Tells signed-in owners (and admins) they already have the course. Per request, so streamed. */
async function CourseAccess({ courseId }: { courseId: string }) {
  const session = await getSession();
  if (!session) return null;
  const admin = isAdmin(session.user);
  const owned = await getPurchase(session.user.id, courseId);
  if (!owned && !admin) return null;
  const [t, locale] = await Promise.all([getTranslations("packages"), getLocale()]);

  return (
    <div className="ownedBanner">
      <span>
        {owned
          ? owned.tier
            ? t("owned", { tier: localize(owned.tier.name, locale) })
            : t("ownedNoTier")
          : t("adminAccess")}
      </span>
      <Link className="btn" href={{ pathname: "/dashboard", query: { course: courseId } }}>
        {t("openDashboard")} <ArrowUpRight size={16} aria-hidden />
      </Link>
    </div>
  );
}
