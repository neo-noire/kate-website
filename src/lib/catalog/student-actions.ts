"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { lessonNote, lessonProgress } from "@/db/schema";
import { getSession, isAdmin } from "@/lib/auth/session";
import { canWatchLesson } from "./queries";

const MAX_NOTE_LENGTH = 5000;

async function requireLessonAccess(lessonId: unknown) {
  const session = await getSession();
  if (!session || typeof lessonId !== "string") return null;
  if (!(await canWatchLesson(session.user.id, isAdmin(session.user), lessonId))) return null;
  return { userId: session.user.id, lessonId };
}

/** Marks a lesson as completed or not for the signed-in student. */
export async function setLessonCompleted(lessonId: string, completed: boolean): Promise<boolean> {
  const access = await requireLessonAccess(lessonId);
  if (!access) return false;
  if (completed) {
    await db.insert(lessonProgress).values(access).onConflictDoNothing();
  } else {
    await db
      .delete(lessonProgress)
      .where(and(eq(lessonProgress.userId, access.userId), eq(lessonProgress.lessonId, access.lessonId)));
  }
  return true;
}

/** Saves the signed-in student's note for a lesson; an empty note deletes it. */
export async function saveLessonNote(lessonId: string, body: string): Promise<boolean> {
  const access = await requireLessonAccess(lessonId);
  if (!access || typeof body !== "string") return false;
  const text = body.slice(0, MAX_NOTE_LENGTH);
  if (!text.trim()) {
    await db.delete(lessonNote).where(and(eq(lessonNote.userId, access.userId), eq(lessonNote.lessonId, access.lessonId)));
  } else {
    await db
      .insert(lessonNote)
      .values({ ...access, body: text })
      .onConflictDoUpdate({ target: [lessonNote.userId, lessonNote.lessonId], set: { body: text, updatedAt: new Date() } });
  }
  return true;
}
