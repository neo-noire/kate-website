"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_COURSE, LESSONS_PER_DANCE, type CourseKey, type PackageId, parseCourseKey, getPackage } from "@/content/catalog";

// Prototype-only persistence for courses, progress, notes and requests. Everything lives in this
// browser's localStorage; nothing is sent anywhere. Accounts are real (see src/lib/auth); these
// records move to the database once purchases exist.

const STORAGE_KEY = "ritmo-demo-v2";

export type Enrollment = { packageId: PackageId; done: number[] };

export type DemoState = {
  enrolled: Partial<Record<CourseKey, Enrollment>>;
  /** Keyed by `${course}#${lessonIndex}`. */
  notes: Record<string, string>;
  subscribed: string;
  feedback: { name: string; email: string; message: string } | null;
  /** The course and lesson the dashboard opens on. */
  current: { course: CourseKey; lesson: number };
};

function initialState(): DemoState {
  return {
    enrolled: { [DEFAULT_COURSE]: { packageId: "solo", done: [] } },
    notes: {},
    subscribed: "",
    feedback: null,
    current: { course: DEFAULT_COURSE, lesson: 0 },
  };
}

const serverState = initialState();
let cache: DemoState | null = null;
const listeners = new Set<() => void>();

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";
const isLesson = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0 && (value as number) < LESSONS_PER_DANCE;

/** Rebuild state from whatever is in storage, keeping only well-formed fields. */
function sanitize(raw: unknown): DemoState {
  const base = initialState();
  if (!isObject(raw)) return base;

  const enrolled: DemoState["enrolled"] = {};
  for (const [key, value] of Object.entries(isObject(raw.enrolled) ? raw.enrolled : {})) {
    if (!parseCourseKey(key) || !isObject(value) || !isString(value.packageId) || !getPackage(value.packageId)) continue;
    const done = Array.isArray(value.done) ? [...new Set(value.done.filter(isLesson))] : [];
    enrolled[key as CourseKey] = { packageId: value.packageId as PackageId, done };
  }
  const courses = Object.keys(enrolled) as CourseKey[];
  if (!courses.length) return base;

  const notes = isObject(raw.notes)
    ? Object.fromEntries(Object.entries(raw.notes).filter((entry): entry is [string, string] => isString(entry[1])))
    : {};
  const current = isObject(raw.current) ? raw.current : {};
  const course = isString(current.course) && courses.includes(current.course as CourseKey) ? (current.course as CourseKey) : courses[0];
  const feedback = isObject(raw.feedback) && isString(raw.feedback.name) && isString(raw.feedback.email) && isString(raw.feedback.message)
    ? { name: raw.feedback.name, email: raw.feedback.email, message: raw.feedback.message }
    : null;

  return {
    enrolled,
    notes,
    subscribed: isString(raw.subscribed) ? raw.subscribed : "",
    feedback,
    current: { course, lesson: course === current.course && isLesson(current.lesson) ? current.lesson : 0 },
  };
}


function read(): DemoState {
  if (cache) return cache;
  try {
    cache = sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"));
  } catch {
    cache = initialState();
  }
  return cache;
}

function write(next: DemoState) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (private mode, blocked site data); keep the in-memory copy.
  }
  listeners.forEach((listener) => listener());
}

// Another tab changed or cleared storage (key is null when storage is cleared).
function onStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  cache = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function useDemoState(): DemoState {
  return useSyncExternalStore(subscribe, read, () => serverState);
}

export function updateDemoState(update: (state: DemoState) => DemoState) {
  write(update(read()));
}

export function resetDemoState() {
  write(initialState());
}

export function noteKey(course: CourseKey, lesson: number) {
  return `${course}#${lesson}`;
}

/** Fired before a full-page language switch so open editors can save their drafts. */
export const BEFORE_LOCALE_CHANGE = "ritmo:before-locale-change";
