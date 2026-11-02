import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CourseActions } from "@/components/admin/course-actions";
import { ConfirmDelete, FormDialog } from "@/components/admin/dialogs";
import { ActionForm, CheckboxField, LocalizedField, SelectField, TextField } from "@/components/admin/forms";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

      <Tabs defaultValue="details" className="mt-6">
        <TabsList>
          <TabsTrigger value="details">{t("sections.details")}</TabsTrigger>
          <TabsTrigger value="tiers">
            {t("sections.tiers")} <Badge variant="secondary">{program.tiers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="courses">
            {t("sections.courses")} <Badge variant="secondary">{program.courses.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="access">
            {t("sections.access")} <Badge variant="secondary">{program.purchases.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="adminCard">
          <ActionForm action={updateProgram} submitLabel={t("save")} hidden={{ id: program.id }}>
            <LocalizedField name="title" label={t("fields.title")} defaultValue={program.title} required />
            <TextField name="slug" label={t("fields.slug")} hint={t("fields.slugHint")} defaultValue={program.slug} required />
            <LocalizedField name="description" label={t("fields.description")} defaultValue={program.description} multiline />
            <LocalizedField name="tag" label={t("fields.tag")} hint={t("fields.tagHint")} defaultValue={program.tag} />
            <LocalizedField name="category" label={t("fields.category")} hint={t("fields.categoryHint")} defaultValue={program.category} />
            <TextField name="sortOrder" label={t("fields.sortOrder")} type="number" defaultValue={program.sortOrder} />
            <CheckboxField name="published" label={t("fields.published")} defaultChecked={program.published} />
          </ActionForm>
          <div className="mt-8 border-t border-border pt-4">
            <ConfirmDelete action={deleteProgram} id={program.id} label={`${t("delete")} · ${title}`} title={title} />
          </div>
        </TabsContent>

        <TabsContent value="tiers" className="adminCard">
          <TiersSection program={program} />
        </TabsContent>
        <TabsContent value="courses" className="adminCard">
          <CoursesSection program={program} />
        </TabsContent>
        <TabsContent value="access" className="adminCard">
          <AccessSection program={program} />
        </TabsContent>
      </Tabs>
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
    <>
      <SectionHeader title={t("sections.tiers")} hint={t("sections.tiersHint")}>
        <FormDialog mode="add" title={t("newTier")}>
          <ActionForm action={createTier} submitLabel={t("add")} resetOnSuccess hidden={{ programId: program.id }}>
            {fields()}
          </ActionForm>
        </FormDialog>
      </SectionHeader>
      <ul className="m-0 list-none p-0">
        {program.tiers.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border py-3">
            <span className="font-medium">{localize(item.name, locale)}</span>
            {item.featured && <Badge>{t("fields.featured")}</Badge>}
            <small className="text-muted-foreground">
              {t("fields.priceSummary", {
                price: formatPrice(item.priceCents, item.currency, locale),
                total: formatPrice(withHst(item.priceCents).total, item.currency, locale),
              })}
            </small>
            <span className="ml-auto flex items-center gap-1">
              <FormDialog mode="edit" title={localize(item.name, locale)}>
                <ActionForm action={updateTier} submitLabel={t("save")} hidden={{ id: item.id }}>
                  {fields(item)}
                </ActionForm>
              </FormDialog>
              <ConfirmDelete action={deleteTier} id={item.id} title={localize(item.name, locale)} />
            </span>
          </li>
        ))}
      </ul>
    </>
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
        <LocalizedField name="description" label={t("fields.description")} defaultValue={item?.description} multiline markdown />
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
        <LocalizedField name="description" label={t("fields.description")} defaultValue={item?.description} multiline markdown />
        <div className="adminRow">
          <TextField name="durationMinutes" label={t("fields.duration")} type="number" defaultValue={item?.durationMinutes} />
          <TextField name="sortOrder" label={t("fields.sortOrder")} type="number" defaultValue={item?.sortOrder ?? course.lessons.length} />
        </div>
        <CheckboxField name="isPreview" label={t("fields.isPreview")} defaultChecked={item?.isPreview} />
      </>
    );
  }

  return (
    <>
      <SectionHeader title={t("sections.courses")} hint={t("sections.coursesHint")}>
        <FormDialog mode="add" title={t("newCourse")}>
          <ActionForm action={createCourse} submitLabel={t("add")} resetOnSuccess hidden={{ programId: program.id }}>
            {courseFields()}
          </ActionForm>
        </FormDialog>
      </SectionHeader>
      <Accordion type="multiple" className="grid gap-3.5">
        {program.courses.map((course) => {
          const courseTitle = localize(course.title, locale);
          const withVideo = course.lessons.filter((lesson) => lesson.videoId).length;
          const videoShare = course.lessons.length ? (withVideo / course.lessons.length) * 100 : 0;
          return (
            <AccordionItem key={course.id} value={course.id} className="rounded-xl border bg-[var(--panel)] last:border-b">
              <div className="flex items-center gap-2 py-3 pr-3 pl-4">
                <AccordionTrigger headerClassName="min-w-0 flex-1" className="min-w-0 items-center py-1 hover:no-underline">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[10px] border border-border bg-secondary text-base font-black text-primary">
                    {courseTitle.charAt(0)}
                  </span>
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate text-base font-bold">{courseTitle}</span>
                    <span className="flex items-center gap-2.5 text-xs font-normal text-muted-foreground">
                      {t("lessonCount", { count: course.lessons.length })}
                      <span className="h-1 w-16 overflow-hidden rounded-full bg-border" aria-hidden>
                        <span className="block h-full bg-primary" style={{ width: `${videoShare}%` }} />
                      </span>
                      {t("videoProgress", { withVideo, total: course.lessons.length })}
                    </span>
                  </span>
                </AccordionTrigger>
                <CourseActions
                  courseId={course.id}
                  courseTitle={courseTitle}
                  deleteAction={deleteCourse}
                  editForm={
                    <ActionForm action={updateCourse} submitLabel={t("save")} hidden={{ id: course.id }}>
                      {courseFields(course)}
                    </ActionForm>
                  }
                  newLessonForm={
                    <ActionForm action={createLesson} submitLabel={t("add")} resetOnSuccess hidden={{ courseId: course.id }}>
                      {lessonFields(course)}
                    </ActionForm>
                  }
                />
              </div>
              <AccordionContent className="px-4 pb-2">
                <ul className="m-0 list-none p-0">
                  {course.lessons.map((lesson, i) => (
                    <li key={lesson.id} className="group flex items-center gap-3.5 border-t border-border py-1.5 pl-1.5">
                      <span className="w-7 text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                      <span className="min-w-0 flex-1 truncate">{localize(lesson.title, locale)}</span>
                      <Badge variant={lesson.videoId ? "default" : "secondary"}>{lesson.videoId ? t("hasVideo") : t("noVideo")}</Badge>
                      <span className="flex items-center opacity-100 transition-opacity [@media(hover:hover)]:opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
                        <FormDialog mode="edit" iconOnly title={localize(lesson.title, locale)}>
                          <ActionForm action={updateLesson} submitLabel={t("save")} hidden={{ id: lesson.id }}>
                            {lessonFields(course, lesson)}
                          </ActionForm>
                        </FormDialog>
                        <ConfirmDelete action={deleteLesson} id={lesson.id} title={localize(lesson.title, locale)} />
                      </span>
                    </li>
                  ))}
                </ul>
                <FormDialog mode="add" title={course.lessons.length ? t("addLesson") : t("noLessons")}>
                  <ActionForm action={createLesson} submitLabel={t("add")} resetOnSuccess hidden={{ courseId: course.id }}>
                    {lessonFields(course)}
                  </ActionForm>
                </FormDialog>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </>
  );
}

async function AccessSection({ program }: { program: AdminProgram }) {
  const [t, locale, format] = await Promise.all([getTranslations("admin"), getLocale(), getFormatter()]);
  const courseTitle = new Map(program.courses.map((c) => [c.id, localize(c.title, locale)]));
  const date = (value: Date) => format.dateTime(value, { dateStyle: "medium" });
  const now = new Date();

  return (
    <>
      <SectionHeader title={t("sections.access")} hint={t("sections.accessHint")}>
        {program.courses.length > 0 && (
          <FormDialog mode="add" title={t("grant")}>
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
          </FormDialog>
        )}
      </SectionHeader>
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
              <span className="ml-auto">
                <ConfirmDelete action={revokeAccess} id={p.id} label={t("revoke")} title={p.user.email} />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="fine">{t("noAccess")}</p>
      )}
    </>
  );
}

function SectionHeader({ title, hint, children }: { title: string; hint: string; children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2>{title}</h2>
        <p className="fine">{hint}</p>
      </div>
      {children}
    </div>
  );
}
