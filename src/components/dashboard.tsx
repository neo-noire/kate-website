"use client";

import { Check, LogIn, LogOut, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  dances,
  getPackage,
  lessons,
  LESSONS_PER_DANCE,
  parseCourseKey,
  courseKey,
  type CourseKey,
} from "@/content/catalog";
import { Link, useRouter } from "@/i18n/navigation";
import { BEFORE_LOCALE_CHANGE, noteKey, updateDemoState, useDemoState } from "@/lib/demo-store";
import { DemoPlayer } from "./demo-player";
import { LoginDialog } from "./login-dialog";
import { useDialogState } from "./modal";
import { useToast } from "./toast";

type Tab = "about" | "notes" | "practice";

const practiceTips = ["repeat", "count", "combine"] as const;

const noopSubscribe = () => () => {};

/** False during server rendering and hydration, true once the browser's saved state can be read. */
function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function Dashboard() {
  const hydrated = useHydrated();
  const { user } = useDemoState();
  // Wait for the saved session before deciding, so signed-in visitors never see the sign-in prompt flash.
  if (!hydrated) return null;
  return user ? <StudentDashboard /> : <SignInRequired />;
}

function SignInRequired() {
  const t = useTranslations("dashboard");
  const login = useDialogState();
  return (
    <main className="section wrap signInRequired">
      <div className="eyebrow">{t("eyebrow")}</div>
      <h1>{t("signInTitle")}</h1>
      <p>{t("signInBody")}</p>
      <button className="btn" onClick={login.show}>
        <LogIn size={16} aria-hidden /> {t("signIn")}
      </button>
      <LoginDialog open={login.open} onClose={login.close} onSignedIn={() => {}} />
    </main>
  );
}

function StudentDashboard() {
  const t = useTranslations();
  const toast = useToast();
  const router = useRouter();
  const state = useDemoState();
  const [tab, setTab] = useState<Tab>("about");

  const { course, lesson } = state.current;
  const parsed = parseCourseKey(course);
  const enrollment = state.enrolled[course];
  if (!parsed || !enrollment) return null;

  const { program, danceId } = parsed;
  const danceName = dances[danceId].name;
  const pkg = getPackage(enrollment.packageId)!;
  const programDone = program.danceIds.reduce(
    (sum, id) => sum + (state.enrolled[courseKey(program.id, id)]?.done.length ?? 0),
    0,
  );
  const lessonDone = enrollment.done.includes(lesson);
  const lessonKey = lessons[lesson].key;
  const lessonTitle = t(`lessons.${lessonKey}.title`);

  function select(next: CourseKey, nextLesson = 0) {
    updateDemoState((s) => ({ ...s, current: { course: next, lesson: nextLesson } }));
  }

  function toggleComplete() {
    // Read the latest saved record, which another tab may have changed since this render.
    let done: number[] = [];
    updateDemoState((s) => {
      const record = s.enrolled[course];
      if (!record) return s;
      done = record.done.includes(lesson) ? record.done.filter((n) => n !== lesson) : [...record.done, lesson];
      return { ...s, enrolled: { ...s.enrolled, [course]: { ...record, done } } };
    });
    if (!done.includes(lesson)) toast(t("dashboard.completionRemoved"));
    else toast(done.length === LESSONS_PER_DANCE ? t("dashboard.danceCompleted") : t("dashboard.lessonCompleted"));
  }

  return (
    <main>
      <div className="wrap studio">
        <div className="studioHeader">
          <div>
            <div className="eyebrow" style={{ marginBottom: 13 }}>
              {t("dashboard.eyebrow")}
            </div>
            <h1>
              {state.user ? t("dashboard.greetingNamed", { name: state.user.name }) : t("dashboard.greetingGuest")}
            </h1>
            <p>{t("dashboard.tagline")}</p>
          </div>
          <div className="studioActions">
            <Link className="btn outline" href="/#courses">
              <Plus size={16} aria-hidden /> {t("dashboard.addCourse")}
            </Link>
            <button
              className="btn quiet"
              onClick={() => {
                updateDemoState((s) => ({ ...s, user: null }));
                router.push("/");
              }}
            >
              <LogOut size={16} aria-hidden /> {t("dashboard.signOut")}
            </button>
          </div>
        </div>

        <div className="studioGrid">
          <aside className="sidebar">
            <h3>{t("dashboard.myDances")}</h3>
            <div className="sidebarCourses">
              <p className="fine courseSummary" style={{ margin: "0 0 10px" }}>
                {t("dashboard.programProgress", {
                  program: program.name,
                  done: programDone,
                  total: program.danceIds.length * LESSONS_PER_DANCE,
                })}
              </p>
              {(Object.keys(state.enrolled) as CourseKey[]).map((key) => {
                const entry = parseCourseKey(key);
                const record = state.enrolled[key];
                if (!entry || !record) return null;
                return (
                  <button key={key} className={`sideCourse${key === course ? " active" : ""}`} onClick={() => select(key)}>
                    {dances[entry.danceId].name}
                    <small>{entry.program.name}</small>
                    <div className="progressTrack">
                      <i style={{ width: `${(record.done.length / LESSONS_PER_DANCE) * 100}%` }} />
                    </div>
                    <small>
                      {t("dashboard.courseProgress", {
                        done: record.done.length,
                        package: getPackage(record.packageId)!.name,
                      })}
                    </small>
                  </button>
                );
              })}
            </div>
            <div className="bookingCard">
              <span className="eyebrow">{t("dashboard.privatePractice")}</span>
              <p>
                {pkg.privateLessons
                  ? t("dashboard.privateLessons", { count: pkg.privateLessons })
                  : t("dashboard.soloPackage")}
              </p>
            </div>
          </aside>

          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>
              {program.name} / {danceName}
            </div>
            <DemoPlayer key={`${course}#${lesson}`} danceName={danceName} lessonTitle={lessonTitle} />
            <div className="lessonHead">
              <div>
                <h2>
                  {String(lesson + 1).padStart(2, "0")}. {lessonTitle}
                </h2>
                <p>
                  {t("dashboard.lessonMeta", {
                    dance: danceName,
                    number: lesson + 1,
                    minutes: lessons[lesson].durationMinutes,
                  })}
                </p>
              </div>
              <button className="btn" onClick={toggleComplete}>
                {lessonDone ? t("dashboard.completed") : t("dashboard.markCompleted")} <Check size={16} aria-hidden />
              </button>
            </div>

            <div className="contentTabs" role="tablist">
              {(["about", "notes", "practice"] as const).map((id) => (
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
                  <h3>{t("dashboard.aboutTitle", { dance: danceName })}</h3>
                  <p>{t(`lessons.${lessonKey}.description`)}</p>
                  <p style={{ marginTop: 10 }}>{t("dashboard.aboutFine")}</p>
                </>
              )}
              {tab === "notes" && <LessonNotes key={noteKey(course, lesson)} noteId={noteKey(course, lesson)} />}
              {tab === "practice" && (
                <>
                  <h3>{t("dashboard.practiceTitle")}</h3>
                  <ul>
                    {practiceTips.map((key) => (
                      <li key={key}>{t(`dashboard.practice.${key}`)}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="lessonList">
              {lessons.map(({ index, key, durationMinutes }) => {
                const done = enrollment.done.includes(index);
                const status = done
                  ? t("dashboard.statusCompleted")
                  : index === lesson
                    ? t("dashboard.statusWatching")
                    : t("dashboard.statusVideo");
                return (
                  <button
                    key={index}
                    className={`lessonItem${index === lesson ? " active" : ""}`}
                    aria-current={index === lesson ? "true" : undefined}
                    onClick={() => select(course, index)}
                  >
                    <b>{done ? <Check size={16} aria-label={t("dashboard.statusCompleted")} /> : String(index + 1).padStart(2, "0")}</b>
                    {t(`lessons.${key}.title`)}
                    <small>{t("dashboard.lessonCardMeta", { minutes: durationMinutes, status })}</small>
                  </button>
                );
              })}
            </div>

            <div className="bookingCard">
              <p>{t("dashboard.mobileNotice")}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function LessonNotes({ noteId }: { noteId: string }) {
  const t = useTranslations("dashboard");
  const toast = useToast();
  const saved = useDemoState().notes[noteId] ?? "";
  const [draft, setDraft] = useState(saved);

  // A language switch reloads the page; keep the unsaved draft, as the prototype did.
  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  useEffect(() => {
    const save = () => updateDemoState((s) => ({ ...s, notes: { ...s.notes, [noteId]: draftRef.current } }));
    window.addEventListener(BEFORE_LOCALE_CHANGE, save);
    return () => window.removeEventListener(BEFORE_LOCALE_CHANGE, save);
  }, [noteId]);

  return (
    <>
      <label htmlFor="notes">{t("notesLabel")}</label>
      <textarea
        id="notes"
        placeholder={t("notesPlaceholder")}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <button
        className="btn outline"
        style={{ marginTop: 10 }}
        onClick={() => {
          updateDemoState((s) => ({ ...s, notes: { ...s.notes, [noteId]: draft } }));
          toast(t("noteSaved"));
        }}
      >
        {t("saveNote")}
      </button>
    </>
  );
}
