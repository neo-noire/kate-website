"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  dances,
  getPackage,
  lessons,
  LESSONS_PER_DANCE,
  parseCourseKey,
  courseKey,
  type CourseKey,
} from "@/content/catalog";
import { format, plural } from "@/i18n/format";
import { BEFORE_LOCALE_CHANGE, noteKey, updateDemoState, useDemoState } from "@/lib/demo-store";
import { BookingDialog } from "./booking-dialog";
import { DemoPlayer } from "./demo-player";
import { useI18n } from "./i18n-provider";
import { useDialogState } from "./modal";
import { useToast } from "./toast";

type Tab = "about" | "notes" | "practice";

export function Dashboard() {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const state = useDemoState();
  const booking = useDialogState();
  const [tab, setTab] = useState<Tab>("about");

  const { course, lesson } = state.current;
  const parsed = parseCourseKey(course);
  const enrollment = state.enrolled[course];
  if (!parsed || !enrollment) return null;

  const { program, danceId } = parsed;
  const danceName = dances[danceId].name;
  const pkg = getPackage(enrollment.packageId)!;
  const courseBookings = state.bookings.filter((b) => b.course === course);
  const programDone = program.danceIds.reduce(
    (sum, id) => sum + (state.enrolled[courseKey(program.id, id)]?.done.length ?? 0),
    0,
  );
  const lessonDone = enrollment.done.includes(lesson);
  const lessonTitle = dict.lessons.titles[lesson];

  function select(next: CourseKey, nextLesson = 0) {
    updateDemoState((s) => ({ ...s, current: { course: next, lesson: nextLesson } }));
  }

  function toggleComplete() {
    const done = enrollment!.done.includes(lesson)
      ? enrollment!.done.filter((n) => n !== lesson)
      : [...enrollment!.done, lesson];
    updateDemoState((s) => ({ ...s, enrolled: { ...s.enrolled, [course]: { ...enrollment!, done } } }));
    if (!done.includes(lesson)) toast(dict.dashboard.completionRemoved);
    else toast(done.length === LESSONS_PER_DANCE ? dict.dashboard.danceCompleted : dict.dashboard.lessonCompleted);
  }

  function requestBooking() {
    // Solo has no private lessons: offer the packages for this dance instead.
    if (pkg.privateLessons === 0) router.push(`/${locale}/programs/${program.id}/${danceId}`);
    else if (courseBookings.length >= pkg.privateLessons) toast(dict.booking.allBooked);
    else booking.show();
  }

  return (
    <main>
      <div className="wrap studio">
        <div className="studioHeader">
          <div>
            <div className="eyebrow" style={{ marginBottom: 13 }}>
              {dict.dashboard.eyebrow}
            </div>
            <h1>
              {state.user ? format(dict.dashboard.greetingNamed, { name: state.user.name }) : dict.dashboard.greetingGuest}
            </h1>
            <p>{dict.dashboard.tagline}</p>
          </div>
          <Link className="btn outline" href={`/${locale}#courses`}>
            {dict.dashboard.addCourse}
          </Link>
        </div>

        <div className="studioGrid">
          <aside className="sidebar">
            <h3>{dict.dashboard.myDances}</h3>
            <div className="sidebarCourses">
              <p className="fine courseSummary" style={{ margin: "0 0 10px" }}>
                {format(dict.dashboard.programProgress, {
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
                      {format(dict.dashboard.courseProgress, {
                        done: record.done.length,
                        package: getPackage(record.packageId)!.name,
                      })}
                    </small>
                  </button>
                );
              })}
            </div>
            <div className="bookingCard">
              <span className="eyebrow">{dict.dashboard.privatePractice}</span>
              <p>
                {pkg.privateLessons
                  ? plural(locale, pkg.privateLessons, dict.dashboard.credits, { used: courseBookings.length })
                  : dict.dashboard.soloPackage}
              </p>
              <button className="btn outline" style={{ width: "100%" }} onClick={requestBooking}>
                {dict.dashboard.bookLesson}
              </button>
              <div className="fine">
                {courseBookings.map((b, i) => (
                  <p key={i}>
                    {b.date} · {b.time}
                    <br />
                    {dict.dashboard.requestPending}
                  </p>
                ))}
              </div>
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
                  {format(dict.dashboard.lessonMeta, {
                    dance: danceName,
                    number: lesson + 1,
                    minutes: lessons[lesson].durationMinutes,
                  })}
                </p>
              </div>
              <button className="btn" onClick={toggleComplete}>
                {lessonDone ? dict.dashboard.completed : dict.dashboard.markCompleted}
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
                  {dict.dashboard.tabs[id]}
                </button>
              ))}
            </div>
            <div id="lesson-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="lessonText">
              {tab === "about" && (
                <>
                  <h3>{format(dict.dashboard.aboutTitle, { dance: danceName })}</h3>
                  <p>{dict.lessons.descriptions[lesson]}</p>
                  <p style={{ marginTop: 10 }}>{dict.dashboard.aboutFine}</p>
                </>
              )}
              {tab === "notes" && <LessonNotes key={noteKey(course, lesson)} noteId={noteKey(course, lesson)} />}
              {tab === "practice" && (
                <>
                  <h3>{dict.dashboard.practiceTitle}</h3>
                  <ul>
                    {dict.dashboard.practice.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="lessonList">
              {lessons.map(({ index, durationMinutes }) => {
                const done = enrollment.done.includes(index);
                const status = done
                  ? dict.dashboard.statusCompleted
                  : index === lesson
                    ? dict.dashboard.statusWatching
                    : dict.dashboard.statusVideo;
                return (
                  <button
                    key={index}
                    className={`lessonItem${index === lesson ? " active" : ""}`}
                    aria-current={index === lesson ? "true" : undefined}
                    onClick={() => select(course, index)}
                  >
                    <b>{done ? "✓" : String(index + 1).padStart(2, "0")}</b>
                    {dict.lessons.titles[index]}
                    <small>{format(dict.dashboard.lessonCardMeta, { minutes: durationMinutes, status })}</small>
                  </button>
                );
              })}
            </div>

            <div className="bookingCard mobileBooking">
              <button className="btn outline" onClick={requestBooking}>
                {dict.dashboard.bookPrivateLesson}
              </button>
              <p>{dict.dashboard.mobileNotice}</p>
            </div>
          </div>
        </div>
      </div>
      <BookingDialog open={booking.open} onClose={booking.close} course={course} />
    </main>
  );
}

function LessonNotes({ noteId }: { noteId: string }) {
  const { dict } = useI18n();
  const toast = useToast();
  const saved = useDemoState().notes[noteId] ?? "";
  const [draft, setDraft] = useState(saved);

  // A language switch reloads the page; keep the unsaved draft, as the prototype did.
  useEffect(() => {
    const save = () => updateDemoState((s) => ({ ...s, notes: { ...s.notes, [noteId]: draft } }));
    window.addEventListener(BEFORE_LOCALE_CHANGE, save);
    return () => window.removeEventListener(BEFORE_LOCALE_CHANGE, save);
  }, [noteId, draft]);

  return (
    <>
      <label htmlFor="notes">{dict.dashboard.notesLabel}</label>
      <textarea
        id="notes"
        placeholder={dict.dashboard.notesPlaceholder}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <button
        className="btn outline"
        style={{ marginTop: 10 }}
        onClick={() => {
          updateDemoState((s) => ({ ...s, notes: { ...s.notes, [noteId]: draft } }));
          toast(dict.dashboard.noteSaved);
        }}
      >
        {dict.dashboard.saveNote}
      </button>
    </>
  );
}
