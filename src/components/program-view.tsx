import { ArrowLeft, ArrowUpRight, Check, Play } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { getSession, isAdmin } from "@/lib/auth/session";
import { getPurchase, type ProgramPage } from "@/lib/catalog/queries";
import { localize, localizeLines } from "@/lib/localized";
import { formatPrice, HST_RATE, hstBreakdown } from "@/lib/money";
import { EnrollButton } from "./enroll-button";
import { PreviewLessonButton } from "./preview-lesson-button";

type Course = ProgramPage["courses"][number];

/** A program's dance tabs, then the selected dance's tiers and lesson outline. */
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
      <div className="danceTabs">
        {page.courses.map((c) => (
          <Link
            key={c.id}
            className={`chip${c.id === course?.id ? " active" : ""}`}
            aria-current={c.id === course?.id ? "page" : undefined}
            href={`/programs/${page.slug}/${c.slug}`}
            scroll={false}
          >
            {localize(c.title, locale)}
          </Link>
        ))}
      </div>

      {course ? (
        <>
          <h2 style={{ fontSize: 20, marginBottom: 20 }}>
            {localize(course.title, locale)}{" "}
            <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: "normal" }}>
              {t("perDance", { count: course.lessons.length })}
            </span>
          </h2>
          {localize(course.description, locale) && <p className="sub">{localize(course.description, locale)}</p>}
          <Suspense fallback={null}>
            <CourseAccess courseId={course.id} />
          </Suspense>
          <Tiers page={page} course={course} programTitle={programTitle} />
          <Lessons course={course} />
          <p className="fine">{t("fine")}</p>
        </>
      ) : (
        <p className="fine">{t("noLessons")}</p>
      )}
    </main>
  );
}

async function Tiers({ page, course, programTitle }: { page: ProgramPage; course: Course; programTitle: string }) {
  const [t, locale] = await Promise.all([getTranslations("packages"), getLocale()]);
  if (!page.tiers.length) return <p className="fine">{t("noTiers")}</p>;
  const courseTitle = localize(course.title, locale);

  return (
    <div className="planGrid">
      {page.tiers.map((tier, i) => {
        const name = localize(tier.name, locale);
        const price = formatPrice(tier.priceCents, tier.currency, locale);
        const { beforeTax, hst } = hstBreakdown(tier.priceCents);
        const breakdown = {
          rate: HST_RATE * 100,
          hst: formatPrice(hst, tier.currency, locale),
          beforeTax: formatPrice(beforeTax, tier.currency, locale),
        };
        const items = [
          t("videoLessons", { count: course.lessons.length }),
          ...(tier.privateLessons
            ? [t("privateLessons", { count: tier.privateLessons, minutes: tier.privateLessonMinutes })]
            : []),
          ...localizeLines(tier.features, locale),
        ];
        return (
          <div className={`plan${tier.featured ? " featured" : ""}`} key={tier.id}>
            <span className="eyebrow">{tier.featured ? t("featured") : t("format", { number: i + 1 })}</span>
            <h3>{name}</h3>
            <div className="price">
              {price} <small>{t("perCourse")}</small>
            </div>
            <p className="taxNote">{t("taxIncluded", breakdown)}</p>
            <ul>
              {items.map((item) => (
                <li key={item}>
                  <Check size={14} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <EnrollButton
              programTitle={programTitle}
              courseTitle={courseTitle}
              tierName={name}
              price={price}
              breakdown={breakdown}
              lessonCount={course.lessons.length}
              privateLessons={tier.privateLessons}
              featured={tier.featured}
            />
          </div>
        );
      })}
    </div>
  );
}

async function Lessons({ course }: { course: Course }) {
  const [t, locale] = await Promise.all([getTranslations("packages"), getLocale()]);
  if (!course.lessons.length) return null;

  return (
    <section className="courseOutline">
      <h2>{t("inside")}</h2>
      <ol>
        {course.lessons.map((lesson, i) => {
          const title = localize(lesson.title, locale);
          return (
            <li key={lesson.id}>
              <b>{String(i + 1).padStart(2, "0")}</b>
              <div>
                <h3>{title}</h3>
                {localize(lesson.description, locale) && <p>{localize(lesson.description, locale)}</p>}
                <small>
                  {lesson.durationMinutes ? t("minutes", { minutes: lesson.durationMinutes }) : null}
                  {lesson.durationMinutes && lesson.isPreview ? " · " : null}
                  {lesson.isPreview ? t("preview") : null}
                </small>
              </div>
              {lesson.previewVideoId && (
                <PreviewLessonButton videoId={lesson.previewVideoId} title={title} className="btn outline">
                  <Play size={16} aria-hidden />
                  <span className="srOnly">{t("watchPreview", { title })}</span>
                </PreviewLessonButton>
              )}
            </li>
          );
        })}
      </ol>
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
