"use client";

import { useSyncExternalStore } from "react";

// Prototype-only persistence for the newsletter and contact forms. Everything lives in this
// browser's localStorage; nothing is sent anywhere. Accounts, courses, progress and notes are
// real and live in the database.

const STORAGE_KEY = "ritmo-demo-v2";

export type DemoState = {
  subscribed: string;
  feedback: { name: string; email: string; message: string } | null;
};

function initialState(): DemoState {
  return { subscribed: "", feedback: null };
}

const serverState = initialState();
let cache: DemoState | null = null;
const listeners = new Set<() => void>();

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";

/** Rebuild state from whatever is in storage, keeping only well-formed fields. */
function sanitize(raw: unknown): DemoState {
  const base = initialState();
  if (!isObject(raw)) return base;

  const feedback = isObject(raw.feedback) && isString(raw.feedback.name) && isString(raw.feedback.email) && isString(raw.feedback.message)
    ? { name: raw.feedback.name, email: raw.feedback.email, message: raw.feedback.message }
    : null;

  return { subscribed: isString(raw.subscribed) ? raw.subscribed : "", feedback };
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
