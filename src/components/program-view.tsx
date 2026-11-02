import { ArrowLeft, ArrowUpRight, Check, ChevronDown, Clock, Video, X } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Markdown } from "@/components/markdown";
import { Link } from "@/i18n/navigation";
import { getSession, isAdmin } from "@/lib/auth/session";
import { getCourseCopy, getTierCopy } from "@/content/programs";
import type { Locale } from "@/i18n/routing";
import { getPurchase, type ProgramPage } from "@/lib/catalog/queries";
import { localize } from "@/lib/localized";
import { formatPrice, HST_RATE, withHst } from "@/lib/money";
import { isStripeConfigured } from "@/lib/stripe/server";
import { cn } from "@/lib/utils";
import { EnrollButton } from "./enroll-button";
import { Expandable } from "./expandable";

type Course = ProgramPage["courses"][number];

/** A program's dance switcher, then the selected dance's description, pricing cards and fine print. */
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
        <div className={cn(page.courses.length <= 1 && "mt-8")}>
          <CourseIntro page={page} course={course} />
          <PricingCards page={page} course={course} programTitle={programTitle} />
          <p className="fine mt-6 text-center">{t("fine")}</p>
        </div>
      ) : (
        <p className="fine">{t("noLessons")}</p>
      )}
    </main>
  );
}

async function CourseIntro({ page, course }: { page: ProgramPage; course: Course }) {
  const [t, locale] = await Promise.all([getTranslations("packages"), getLocale()]);
  const description = getCourseCopy(page.slug, course.slug, locale as Locale)?.about ?? localize(course.description, locale);
  const totalMinutes = course.lessons.reduce((sum, lesson) => sum + (lesson.durationMinutes ?? 0), 0);
  const cheapest = page.tiers.length ? page.tiers.reduce((a, b) => (a.priceCents <= b.priceCents ? a : b)) : undefined;

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
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
        <div className="min-w-0">
          <Suspense fallback={null}>
            <CourseAccess courseId={course.id} />
          </Suspense>
          {description && (
            <Expandable>
              <Markdown>{description}</Markdown>
            </Expandable>
          )}
        </div>
        <aside className="grid gap-3.5 rounded-2xl border border-border bg-[var(--panel)] p-5 text-sm">
          <h3 className="m-0 text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">{t("glance")}</h3>
          <dl className="m-0 grid gap-2.5">
            <GlanceRow label={t("glanceLessons")} value={t("videoLessons", { count: course.lessons.length })} />
            {totalMinutes > 0 && <GlanceRow label={t("glanceLength")} value={t("minutes", { minutes: totalMinutes })} />}
            <GlanceRow label={t("glanceAccess")} value={t("glanceAccessValue")} />
            {cheapest && (
              <GlanceRow
                label={t("glanceFrom")}
                value={formatPrice(withHst(cheapest.priceCents).total, cheapest.currency, locale)}
              />
            )}
          </dl>
          {page.tiers.length > 0 && (
            <a
              href="#pricing"
              className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border font-bold transition-colors hover:border-muted-foreground/50 hover:bg-accent"
            >
              {t("compareFormats")} <ChevronDown size={14} aria-hidden />
            </a>
          )}
        </aside>
      </div>
    </>
  );
}

function GlanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="m-0 text-right font-bold">{value}</dd>
    </div>
  );
}

/** Bolds a leading number ("4 private sessions") so the difference between plans reads at a glance. */
function withBoldNumber(text: string) {
  const [, number, rest] = text.match(/^(\d+)(.*)$/s) ?? [];
  return number ? (
    <>
      <strong className="text-base text-foreground">{number}</strong>
      {rest}
    </>
  ) : (
    text
  );
}

const CARD_BUTTON = "inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl text-[13px] font-bold transition-colors";

async function PricingCards({ page, course, programTitle }: { page: ProgramPage; course: Course; programTitle: string }) {
  const [t, locale] = await Promise.all([getTranslations("packages"), getLocale()]);
  if (!page.tiers.length) return <p className="fine">{t("noTiers")}</p>;
  const courseTitle = localize(course.title, locale);
  const paymentsEnabled = isStripeConfigured();

  return (
    <section id="pricing" className="mt-14 scroll-mt-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div>
          <div className="eyebrow">{t("eyebrow")}</div>
          <h2 className="mt-1 text-[28px] font-black tracking-tight">{t("pickFormat", { course: courseTitle })}</h2>
        </div>
        <p className="m-0 text-[13px] text-muted-foreground">{t("pricesNote")}</p>
      </div>
      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        {page.tiers.map((tier, i) => {
          const name = localize(tier.name, locale);
          const { beforeTax, hst, total } = withHst(tier.priceCents);
          const price = formatPrice(total, tier.currency, locale);
          const breakdown = {
            rate: HST_RATE * 100,
            hst: formatPrice(hst, tier.currency, locale),
            beforeTax: formatPrice(beforeTax, tier.currency, locale),
          };
          const copy = getTierCopy(page.slug, tier.key, locale as Locale);
          // Without copy in src/content, fall back to what the database knows.
          const included = copy
            ? copy.included
            : [
                t("videoLessons", { count: course.lessons.length }),
                ...(tier.privateLessons ? [t("privateLessons", { count: tier.privateLessons, minutes: tier.privateLessonMinutes })] : []),
              ];
          const excluded = copy?.notIncluded ?? [];
          const description = copy?.description;
          const howItWorks = copy?.howItWorks;
          return (
            <article
              key={tier.id}
              className={cn(
                "relative flex flex-col gap-4 rounded-2xl border p-6 transition-colors",
                tier.featured ? "border-primary bg-[#1d1716]" : "border-border bg-[var(--panel)] hover:border-muted-foreground/40",
              )}
            >
              {tier.featured && (
                <span className="absolute -top-2.5 left-6 rounded-full bg-primary px-2.5 text-[9px] font-bold tracking-wider text-white uppercase">
                  {t("featured")}
                </span>
              )}
              <div>
                <div className="text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                  {copy?.tagline ?? t("format", { number: i + 1 })}
                </div>
                <h3 className="mt-0.5 text-[22px] leading-tight font-bold">{name}</h3>
              </div>
              {description && <p className="m-0 text-sm text-foreground/85 lg:min-h-[5.5rem]">{description}</p>}
              <div className="flex items-baseline gap-2 border-t border-border pt-4">
                <span className="text-[44px] leading-none font-black tracking-tight">{price}</span>
                <small className="text-[12.5px] text-muted-foreground">{t("perCourse")}</small>
              </div>
              <p className="-mt-2 mb-0 text-xs text-muted-foreground">{t("taxIncluded", breakdown)}</p>
              <ul className="m-0 grid list-none gap-2.5 p-0 text-sm">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check size={14} aria-hidden className="mt-1 shrink-0 text-primary" />
                    <span>{withBoldNumber(item)}</span>
                  </li>
                ))}
                {excluded.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-muted-foreground">
                    <X size={14} aria-hidden className="mt-1 shrink-0" />
                    <span className="line-through decoration-muted-foreground/60">{item}</span>
                    <span className="sr-only">{t("notIncluded")}</span>
                  </li>
                ))}
              </ul>
              <div className="flex-1" />
              {howItWorks && (
                <details className="group border-t border-border pt-3 text-[13px] text-muted-foreground">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-foreground [&::-webkit-details-marker]:hidden">
                    {t("howItWorks")}
                    <ChevronDown size={14} aria-hidden className="transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-2 mb-0">{howItWorks}</p>
                </details>
              )}
              <EnrollButton
                className={cn(
                  CARD_BUTTON,
                  tier.featured ? "bg-primary text-white hover:bg-primary/90" : "border border-border hover:border-muted-foreground/50 hover:bg-accent",
                )}
                programTitle={programTitle}
                courseTitle={courseTitle}
                tierName={name}
                price={price}
                breakdown={breakdown}
                tierId={tier.id}
                courseId={course.id}
                paymentsEnabled={paymentsEnabled}
                lessonCount={course.lessons.length}
                privateLessons={tier.privateLessons}
                featured={tier.featured}
              />
            </article>
          );
        })}
      </div>
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
