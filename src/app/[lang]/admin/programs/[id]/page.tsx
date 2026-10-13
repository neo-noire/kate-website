import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActionForm, CheckboxField, LocalizedField, SelectField, TextField } from "@/components/admin/forms";
import { Link } from "@/i18n/navigation";
import { requireAdminPage } from "@/lib/auth/admin-page";
import {
  createCourse,
  createLesson,
  createTier,
  deleteCourse,
  deleteLesson,
  deleteProgram,
  deleteTier,
  grantAccess,
  revokeAccess,
  updateCourse,
  updateLesson,
  updateProgram,
  updateTier,
} from "@/lib/catalog/admin-actions";
import { getAdminProgram, type AdminProgram } from "@/lib/catalog/admin-queries";
import { localize } from "@/lib/localized";
import { CURRENCIES, formatPrice, withHst } from "@/lib/money";
import { youTubeWatchUrl } from "@/lib/youtube";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("title"), robots: { index: false } };
}

export default function AdminProgramPage({ params }: PageProps<"/[lang]/admin/programs/[id]">) {
  return (
    <Suspense fallback={<main className="section wrap" style={{ minHeight: "60vh" }} />}>
      <ProgramEditor params={params} />
    </Suspense>
  );
}

async function ProgramEditor({ params }: Pick<PageProps<"/[lang]/admin/programs/[id]">, "params">) {
  const { id } = await params;
  await requireAdminPage(`/admin/programs/${id}`);
  const program = await getAdminProgram(id);
  if (!program) notFound();
  const [t, locale] = await Promise.all([getTranslations("admin"), getLocale()]);
  const title = localize(program.title, locale);

  return (
    <main className="section wrap adminPage">
      <Link className="backLink" href="/admin">
        <ArrowLeft size={14} aria-hidden /> {t("back")}
      </Link>
      <div className="eyebrow">
        {t("eyebrow")} · <span className={`badge${program.published ? " live" : ""}`}>{program.published ? t("published") : t("draft")}</span>
      </div>
      <h1>{title}</h1>
      {program.published && (
        <p>
          <Link className="btn quiet" href={`/programs/${program.slug}`}>
            {t("view")} <ArrowUpRight size={14} aria-hidden />
          </Link>
        </p>
      )}

      <section className="adminCard">
        <h2>{t("sections.details")}</h2>
        <ActionForm action={updateProgram} submitLabel={t("save")} hidden={{ id: program.id }}>
          <LocalizedField name="title" label={t("fields.title")} defaultValue={program.title} required />
          <TextField name="slug" label={t("fields.slug")} hint={t("fields.slugHint")} defaultValue={program.slug} required />
          <LocalizedField name="description" label={t("fields.description")} defaultValue={program.description} multiline />
          <LocalizedField name="tag" label={t("fields.tag")} hint={t("fields.tagHint")} defaultValue={program.tag} />
          <LocalizedField name="category" label={t("fields.category")} hint={t("fields.categoryHint")} defaultValue={program.category} />
          <TextField name="sortOrder" label={t("fields.sortOrder")} type="number" defaultValue={program.sortOrder} />
          <CheckboxField name="published" label={t("fields.published")} defaultChecked={program.published} />
        </ActionForm>
      </section>

      <TiersSection program={program} />
      <CoursesSection program={program} />
      <AccessSection program={program} />

      <ActionForm
        action={deleteProgram}
        submitLabel={`${t("delete")} · ${title}`}
        confirm={t("confirmDelete")}
        danger
        hidden={{ id: program.id }}
      />
    </main>
  );
}

async function TiersSection({ program }: { program: AdminProgram }) {
  const [t, locale] = await Promise.all([getTranslations("admin"), getLocale()]);
  const currencies = CURRENCIES.map((c) => ({ value: c, label: c }));

  function fields(item?: AdminProgram["tiers"][number]) {
    return (
      <>
        <LocalizedField name="name" label={t("fields.name")} defaultValue={item?.name} required />
        <div className="adminRow">
          <TextField
            name="price"
            label={t("fields.price")}
            hint={t("fields.priceHint")}
            inputMode="decimal"
            defaultValue={item ? (item.priceCents / 100).toFixed(item.priceCents % 100 ? 2 : 0) : ""}
            required
          />
          <SelectField name="currency" label={t("fields.currency")} options={currencies} defaultValue={item?.currency} />
        </div>
        <div className="adminRow">
          <TextField name="privateLessons" label={t("fields.privateLessons")} type="number" defaultValue={item?.privateLessons ?? 0} />
          <TextField
            name="privateLessonMinutes"
            label={t("fields.privateLessonMinutes")}
            type="number"
            defaultValue={item?.privateLessonMinutes ?? 50}
          />
        </div>
        <LocalizedField name="features" label={t("fields.features")} defaultValue={item?.features} multiline />
        <div className="adminRow">
          <TextField name="sortOrder" label={t("fields.sortOrder")} type="number" defaultValue={item?.sortOrder ?? program.tiers.length} />
          <CheckboxField name="featured" label={t("fields.featured")} defaultChecked={item?.featured} />
        </div>
      </>
    );
  }

  return (
    <section className="adminCard">
      <h2>{t("sections.tiers")}</h2>
      <p className="fine">{t("sections.tiersHint")}</p>
      {program.tiers.map((item) => (
        <details key={item.id} className="adminItem">
          <summary>
            {localize(item.name, locale)} ·{" "}
            {t("fields.priceSummary", {
              price: formatPrice(item.priceCents, item.currency, locale),
              total: formatPrice(withHst(item.priceCents).total, item.currency, locale),
            })}
          </summary>
          <ActionForm action={updateTier} submitLabel={t("save")} hidden={{ id: item.id }}>
            {fields(item)}
          </ActionForm>
          <ActionForm action={deleteTier} submitLabel={t("delete")} confirm={t("confirmDelete")} danger hidden={{ id: item.id }} />
        </details>
      ))}
      <details className="adminItem new">
        <summary>{t("newTier")}</summary>
        <ActionForm action={createTier} submitLabel={t("add")} resetOnSuccess hidden={{ programId: program.id }}>
          {fields()}
        </ActionForm>
      </details>
    </section>
  );
}

async function CoursesSection({ program }: { program: AdminProgram }) {
  const [t, locale] = await Promise.all([getTranslations("admin"), getLocale()]);
  type Course = AdminProgram["courses"][number];
  type Lesson = Course["lessons"][number];

  function courseFields(item?: Course) {
    return (
      <>
        <LocalizedField name="title" label={t("fields.title")} defaultValue={item?.title} required />
        <div className="adminRow">
          <TextField name="slug" label={t("fields.slug")} hint={t("fields.slugHint")} defaultValue={item?.slug} required />
          <TextField name="sortOrder" label={t("fields.sortOrder")} type="number" defaultValue={item?.sortOrder ?? program.courses.length} />
        </div>
        <LocalizedField name="description" label={t("fields.description")} defaultValue={item?.description} multiline />
      </>
    );
  }

  function lessonFields(course: Course, item?: Lesson) {
    return (
      <>
        <LocalizedField name="title" label={t("fields.title")} defaultValue={item?.title} required />
        <TextField
          name="video"
          label={t("fields.video")}
          hint={t("fields.videoHint")}
          defaultValue={item?.videoId ? youTubeWatchUrl(item.videoId) : ""}
          type="url"
        />
        <LocalizedField name="description" label={t("fields.description")} defaultValue={item?.description} multiline />
        <div className="adminRow">
          <TextField name="durationMinutes" label={t("fields.duration")} type="number" defaultValue={item?.durationMinutes} />
          <TextField name="sortOrder" label={t("fields.sortOrder")} type="number" defaultValue={item?.sortOrder ?? course.lessons.length} />
        </div>
        <CheckboxField name="isPreview" label={t("fields.isPreview")} defaultChecked={item?.isPreview} />
      </>
    );
  }

  return (
    <section className="adminCard">
      <h2>{t("sections.courses")}</h2>
      <p className="fine">{t("sections.coursesHint")}</p>
      {program.courses.map((course) => (
        <details key={course.id} className="adminItem">
          <summary>
            {localize(course.title, locale)} · {t("lessonCount", { count: course.lessons.length })}
          </summary>
          <ActionForm action={updateCourse} submitLabel={t("save")} hidden={{ id: course.id }}>
            {courseFields(course)}
          </ActionForm>

          <h3>{t("sections.lessons")}</h3>
          {course.lessons.map((lesson, i) => (
            <details key={lesson.id} className="adminItem">
              <summary>
                {String(i + 1).padStart(2, "0")}. {localize(lesson.title, locale)}
                <span className={`badge${lesson.videoId ? " live" : ""}`}>{lesson.videoId ? t("hasVideo") : t("noVideo")}</span>
              </summary>
              <ActionForm action={updateLesson} submitLabel={t("save")} hidden={{ id: lesson.id }}>
                {lessonFields(course, lesson)}
              </ActionForm>
              <ActionForm action={deleteLesson} submitLabel={t("delete")} confirm={t("confirmDelete")} danger hidden={{ id: lesson.id }} />
            </details>
          ))}
          <details className="adminItem new">
            <summary>{t("newLesson")}</summary>
            <ActionForm action={createLesson} submitLabel={t("add")} resetOnSuccess hidden={{ courseId: course.id }}>
              {lessonFields(course)}
            </ActionForm>
          </details>

          <ActionForm action={deleteCourse} submitLabel={t("delete")} confirm={t("confirmDelete")} danger hidden={{ id: course.id }} />
        </details>
      ))}
      <details className="adminItem new">
        <summary>{t("newCourse")}</summary>
        <ActionForm action={createCourse} submitLabel={t("add")} resetOnSuccess hidden={{ programId: program.id }}>
          {courseFields()}
        </ActionForm>
      </details>
    </section>
  );
}

async function AccessSection({ program }: { program: AdminProgram }) {
  const [t, locale, format] = await Promise.all([getTranslations("admin"), getLocale(), getFormatter()]);
  const courseTitle = new Map(program.courses.map((c) => [c.id, localize(c.title, locale)]));
  const date = (value: Date) => format.dateTime(value, { dateStyle: "medium" });
  const now = new Date();

  return (
    <section className="adminCard">
      <h2>{t("sections.access")}</h2>
      <p className="fine">{t("sections.accessHint")}</p>
      {program.courses.length > 0 && (
        <ActionForm action={grantAccess} submitLabel={t("grant")} resetOnSuccess>
          <TextField name="email" label={t("fields.email")} type="email" required />
          <div className="adminRow">
            <SelectField
              name="courseId"
              label={t("fields.course")}
              options={program.courses.map((c) => ({ value: c.id, label: localize(c.title, locale) }))}
            />
            <SelectField
              name="tierId"
              label={t("fields.tier")}
              options={[
                ...program.tiers.map((tier) => ({ value: tier.id, label: localize(tier.name, locale) })),
                { value: "", label: t("fields.noTier") },
              ]}
            />
          </div>
        </ActionForm>
      )}
      {program.purchases.length ? (
        <ul className="adminList">
          {program.purchases.map((p) => (
            <li key={p.id}>
              <span>
                <b>{p.user.name}</b> {p.user.email}
              </span>
              <small>
                {courseTitle.get(p.courseId)}
                {p.tier ? ` · ${localize(p.tier.name, locale)}` : ""} · {t(`source.${p.source === "stripe" ? "stripe" : "admin"}`)}
              </small>
              <small>
                {p.expiresAt &&
                  (p.expiresAt > now ? t("accessUntil", { date: date(p.expiresAt) }) : t("expired", { date: date(p.expiresAt) }))}
                {p.expiresAt && " · "}
                {p.firstWatchedAt ? t("firstWatched", { date: date(p.firstWatchedAt) }) : t("notWatched")}
              </small>
              <ActionForm action={revokeAccess} submitLabel={t("revoke")} confirm={t("confirmDelete")} danger hidden={{ id: p.id }} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="fine">{t("noAccess")}</p>
      )}
    </section>
  );
}
