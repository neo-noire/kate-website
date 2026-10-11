"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_COURSE, type CourseKey, type PackageId, parseCourseKey, getPackage } from "@/content/catalog";

// Prototype-only persistence. Everything lives in this browser's localStorage; nothing is
// sent anywhere. Production replaces this with authenticated, database-backed records.

const STORAGE_KEY = "ritmo-demo-v2";

export type DemoUser = { name: string; email: string };
export type Enrollment = { packageId: PackageId; done: number[] };

export type DemoState = {
  user: DemoUser | null;
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
    user: null,
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

function sanitize(raw: unknown): DemoState {
  const base = initialState();
  if (!raw || typeof raw !== "object") return base;
  const saved = raw as Partial<DemoState>;
  const enrolled: DemoState["enrolled"] = {};
  for (const [key, value] of Object.entries(saved.enrolled ?? {})) {
    if (parseCourseKey(key) && value && getPackage(value.packageId)) {
      enrolled[key as CourseKey] = { packageId: value.packageId, done: value.done.filter((n) => n >= 0 && n < 4) };
    }
  }
  const state: DemoState = {
    ...base,
    ...saved,
    enrolled: Object.keys(enrolled).length ? enrolled : base.enrolled,
  };
  if (!state.enrolled[state.current.course]) state.current = { course: Object.keys(state.enrolled)[0] as CourseKey, lesson: 0 };
  return state;
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

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
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
