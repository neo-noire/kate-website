"use client";

import { Check, LogOut, Plus, Settings } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { getPathname, Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";
import type { Library } from "@/lib/catalog/queries";
import { saveLessonNote, setLessonCompleted } from "@/lib/catalog/student-actions";
import { localize } from "@/lib/localized";
import { useToast } from "./toast";
import { LessonVideo } from "./lesson-video";

type Tab = "about" | "notes";
type Course = Library["courses"][number];

type DashboardProps = {
  userName: string;
  admin: boolean;
  library: Library;
  /** Course to open first, e.g. from a course page's "Open in my dashboard". */
  initialCourseId?: string;
  /** Set when the student just came back from Stripe Checkout. */
  checkout?: "paid" | "pending";
};

/** The student dashboard: the courses this student owns (every course for admins). */
export function Dashboard({ userName, admin, library, initialCourseId, checkout }: DashboardProps) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <main>
      <div className="wrap studio">
        <div className="studioHeader">
          <div>
            <div className="eyebrow" style={{ marginBottom: 13 }}>
              {t("dashboard.eyebrow")}
            </div>
            <h1>{t("dashboard.greetingNamed", { name: userName })}</h1>
            <p>{t("dashboard.tagline")}</p>
          </div>
          <div className="studioActions">
            {admin && (
              <Link className="btn outline" href="/admin">
                <Settings size={16} aria-hidden /> {t("dashboard.manage")}
              </Link>
            )}
            <Link className="btn outline" href="/#courses">
              <Plus size={16} aria-hidden /> {t("dashboard.addCourse")}
            </Link>
            <button
              className="btn quiet"
              onClick={async () => {
                await authClient.signOut();
                // A full page load clears anything the router cached while signed in.
                window.location.assign(getPathname({ href: "/", locale }));
              }}
            >
              <LogOut size={16} aria-hidden /> {t("auth.signOut")}
            </button>
          </div>
        </div>

        {checkout && (
          <p className="ownedBanner" role="status">
            {checkout === "paid" ? t("dashboard.checkoutPaid") : t("dashboard.checkoutPending")}
          </p>
        )}

        {library.courses.length ? (
          <Studio admin={admin} library={library} initialCourseId={initialCourseId} />
        ) : (
          <div className="emptyLibrary">
            <h2>{t("dashboard.emptyTitle")}</h2>
            <p>{t("dashboard.emptyBody")}</p>
            <Link className="btn" href="/#courses">
              {t("dashboard.browse")}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

function Studio({ admin, library, initialCourseId }: Omit<DashboardProps, "userName">) {
  const t = useTranslations();
  const locale = useLocale();
  const toast = useToast();
  const format = useFormatter();
  const [, startTransition] = useTransition();
  const [completed, setCompleted] = useState(() => new Set(library.completed));
  const [notes, setNotes] = useState(library.notes);
  const [courseId, setCourseId] = useState(
    () => library.courses.find((c) => c.id === initialCourseId)?.id ?? library.courses[0].id,
  );
  const [tab, setTab] = useState<Tab>("about");

  const course = library.courses.find((c) => c.id === courseId)!;
  const [lessonIndex, setLessonIndex] = useState(() => firstOpenLesson(course, completed));
  const lesson = course.lessons[Math.min(lessonIndex, course.lessons.length - 1)];
  const courseTitle = localize(course.title, locale);
  const doneCount = (c: Course) => c.lessons.filter((l) => completed.has(l.id)).length;

  function selectCourse(next: Course) {
    setCourseId(next.id);
    setLessonIndex(firstOpenLesson(next, completed));
  }

  function toggleComplete() {
    if (!lesson) return;
    const done = !completed.has(lesson.id);
    const next = new Set(completed);
    if (done) next.add(lesson.id);
    else next.delete(lesson.id);
    setCompleted(next);
    if (!done) toast(t("dashboard.completionRemoved"));
    else toast(doneCountIn(course, next) === course.lessons.length ? t("dashboard.danceCompleted") : t("dashboard.lessonCompleted"));

    startTransition(async () => {
      if (await setLessonCompleted(lesson.id, done)) return;
      setCompleted((current) => {
        const reverted = new Set(current);
        if (done) reverted.delete(lesson.id);
        else reverted.add(lesson.id);
        return reverted;
      });
      toast(t("dashboard.saveError"));
    });
  }

  return (
    <div className="studioGrid">
      <aside className="sidebar">
        <h3>{admin ? t("dashboard.allCourses") : t("dashboard.myDances")}</h3>
        <div className="sidebarCourses">
          {library.courses.map((c) => (
            <button key={c.id} className={`sideCourse${c.id === course.id ? " active" : ""}`} onClick={() => selectCourse(c)}>
              {localize(c.title, locale)}
              <small>{localize(c.programTitle, locale)}</small>
              <div className="progressTrack">
                <i style={{ width: `${c.lessons.length ? (doneCount(c) / c.lessons.length) * 100 : 0}%` }} />
              </div>
              <small>
                {c.tier
                  ? t("dashboard.courseProgressTier", { done: doneCount(c), total: c.lessons.length, tier: localize(c.tier.name, locale) })
                  : t("dashboard.courseProgress", { done: doneCount(c), total: c.lessons.length })}
              </small>
            </button>
          ))}
        </div>
        {course.expiresAt && (
          <p className="accessUntil">
            {t("dashboard.accessUntil", { date: format.dateTime(course.expiresAt, { dateStyle: "long" }) })}
          </p>
        )}
        {course.tier && (
          <div className="bookingCard">
            <span className="eyebrow">{t("dashboard.privatePractice")}</span>
            <p>
              {course.tier.privateLessons
                ? t("dashboard.privateLessons", { count: course.tier.privateLessons })
                : t("dashboard.soloPackage")}
            </p>
          </div>
        )}
      </aside>

      <div>
        <div className="eyebrow" style={{ marginBottom: 14 }}>
          {localize(course.programTitle, locale)} / {courseTitle}
        </div>
        {!lesson ? (
          <p className="lessonText">{t("dashboard.noLessons")}</p>
        ) : (
          <>
            {lesson.hasVideo ? (
              <LessonVideo key={lesson.id} lessonId={lesson.id} title={localize(lesson.title, locale)} />
            ) : (
              <div className="videoFrame videoPending">
                <p>{t("dashboard.videoComingSoon")}</p>
              </div>
            )}
            <div className="lessonHead">
              <div>
                <h2>
                  {String(lessonIndex + 1).padStart(2, "0")}. {localize(lesson.title, locale)}
                </h2>
                <p>
                  {t("dashboard.lessonMeta", { course: courseTitle, number: lessonIndex + 1, total: course.lessons.length })}
                  {lesson.durationMinutes ? ` · ${t("dashboard.lessonMinutes", { minutes: lesson.durationMinutes })}` : ""}
                </p>
              </div>
              <button className="btn" onClick={toggleComplete}>
                {completed.has(lesson.id) ? t("dashboard.completed") : t("dashboard.markCompleted")} <Check size={16} aria-hidden />
              </button>
            </div>

            <div className="contentTabs" role="tablist">
              {(["about", "notes"] as const).map((id) => (
                <button
                  key={id}
                  role="tab"
                  id={`tab-${id}`}
                  aria-selected={tab === id}
                  aria-controls="lesson-panel"
                  className={tab === id ? "active" : undefined}
                  onClick={() => setTab(id)}
                >
                  {t(`dashboard.tabs.${id}`)}
                </button>
              ))}
            </div>
            <div id="lesson-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="lessonText">
              {tab === "about" && (
                <>
                  <h3>{t("dashboard.aboutTitle", { lesson: localize(lesson.title, locale) })}</h3>
                  {localize(lesson.description, locale) && <p>{localize(lesson.description, locale)}</p>}
                  <p style={{ marginTop: 10 }}>{t("dashboard.aboutFine")}</p>
                </>
              )}
              {tab === "notes" && (
                <LessonNotes
                  key={lesson.id}
                  lessonId={lesson.id}
                  saved={notes[lesson.id] ?? ""}
                  onSaved={(body) => setNotes((current) => ({ ...current, [lesson.id]: body }))}
                />
              )}
            </div>
          </>
        )}

        <div className="lessonList">
          {course.lessons.map((item, index) => {
            const done = completed.has(item.id);
            const status = done
              ? t("dashboard.statusCompleted")
              : item.id === lesson?.id
                ? t("dashboard.statusWatching")
                : t("dashboard.statusVideo");
            return (
              <button
                key={item.id}
                className={`lessonItem${item.id === lesson?.id ? " active" : ""}`}
                aria-current={item.id === lesson?.id ? "true" : undefined}
                onClick={() => setLessonIndex(index)}
              >
                <b>{done ? <Check size={16} aria-label={t("dashboard.statusCompleted")} /> : String(index + 1).padStart(2, "0")}</b>
                {localize(item.title, locale)}
                <small>
                  {item.durationMinutes ? t("dashboard.lessonCardMeta", { minutes: item.durationMinutes, status }) : status}
                </small>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function doneCountIn(course: Course, completed: Set<string>) {
  return course.lessons.filter((l) => completed.has(l.id)).length;
}

/** The first lesson not yet completed, or the first lesson. */
function firstOpenLesson(course: Course, completed: Set<string>) {
  return Math.max(0, course.lessons.findIndex((l) => !completed.has(l.id)));
}

function LessonNotes({ lessonId, saved, onSaved }: { lessonId: string; saved: string; onSaved: (body: string) => void }) {
  const t = useTranslations("dashboard");
  const toast = useToast();
  const [draft, setDraft] = useState(saved);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <label htmlFor="notes">{t("notesLabel")}</label>
      <textarea id="notes" placeholder={t("notesPlaceholder")} value={draft} onChange={(event) => setDraft(event.target.value)} />
      <button
        className="btn outline"
        style={{ marginTop: 10 }}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            if (await saveLessonNote(lessonId, draft)) {
              onSaved(draft);
              toast(t("noteSaved"));
            } else {
              toast(t("saveError"));
            }
          })
        }
      >
        {t("saveNote")}
      </button>
    </>
  );
}
