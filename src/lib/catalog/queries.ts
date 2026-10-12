import "server-only";
import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { course, lesson, lessonNote, lessonProgress, program, purchase, tier } from "@/db/schema";

/** Every public catalog read carries this tag; admin changes expire it. */
export const CATALOG_TAG = "catalog";


const tierColumns = {
  id: true,
  name: true,
  priceCents: true,
  currency: true,
  privateLessons: true,
  privateLessonMinutes: true,
  features: true,
  featured: true,
} as const;

/** Published programs for the home page catalog. */
export async function getCatalog() {
  "use cache";
  cacheLife("max");
  cacheTag(CATALOG_TAG);

  const rows = await db.query.program.findMany({
    where: eq(program.published, true),
    orderBy: [asc(program.sortOrder), asc(program.createdAt)],
    columns: { id: true, slug: true, title: true, description: true, tag: true, category: true },
    with: {
      courses: { columns: { id: true }, with: { lessons: { columns: { id: true } } } },
      tiers: { columns: { priceCents: true, currency: true } },
    },
  });

  return rows.map(({ courses, tiers, ...rest }) => {
    const cheapest = tiers.reduce<(typeof tiers)[number] | undefined>(
      (low, t) => (!low || t.priceCents < low.priceCents ? t : low),
      undefined,
    );
    return {
      ...rest,
      courseCount: courses.length,
      lessonCount: courses.reduce((sum, c) => sum + c.lessons.length, 0),
      fromPrice: cheapest ?? null,
    };
  });
}

export type CatalogProgram = Awaited<ReturnType<typeof getCatalog>>[number];

/**
 * A published program with its courses, lesson outlines and tiers. Video ids are included
 * only for free preview lessons.
 */
export async function getProgramPage(slug: string) {
  "use cache";
  cacheLife("max");
  cacheTag(CATALOG_TAG);

  const row = await db.query.program.findFirst({
    where: and(eq(program.slug, slug), eq(program.published, true)),
    columns: { id: true, slug: true, title: true, description: true },
    with: {
      courses: {
        orderBy: [asc(course.sortOrder), asc(course.createdAt)],
        columns: { id: true, slug: true, title: true, description: true },
        with: {
          lessons: {
            orderBy: [asc(lesson.sortOrder), asc(lesson.createdAt)],
            columns: { id: true, title: true, description: true, durationMinutes: true, isPreview: true, videoId: true },
          },
        },
      },
      tiers: { orderBy: [asc(tier.sortOrder), asc(tier.createdAt)], columns: tierColumns },
    },
  });
  if (!row) return null;

  return {
    ...row,
    courses: row.courses.map((c) => ({
      ...c,
      lessons: c.lessons.map(({ videoId, ...l }) => ({ ...l, previewVideoId: l.isPreview ? videoId : null })),
    })),
  };
}

export type ProgramPage = NonNullable<Awaited<ReturnType<typeof getProgramPage>>>;

/** A free preview lesson with a video, for the home page's "Preview a lesson" button. */
export async function getFeaturedPreview() {
  "use cache";
  cacheLife("max");
  cacheTag(CATALOG_TAG);

  const [row] = await db
    .select({ title: lesson.title, videoId: lesson.videoId, programSlug: program.slug, courseSlug: course.slug })
    .from(lesson)
    .innerJoin(course, eq(lesson.courseId, course.id))
    .innerJoin(program, eq(course.programId, program.id))
    .where(and(eq(lesson.isPreview, true), isNotNull(lesson.videoId), eq(program.published, true)))
    .orderBy(asc(program.sortOrder), asc(course.sortOrder), asc(lesson.sortOrder))
    .limit(1);
  return row?.videoId ? { ...row, videoId: row.videoId } : null;
}

/** The user's purchase of a course, with its tier, or undefined. Not cached: per user. */
export async function getPurchase(userId: string, courseId: string) {
  return db.query.purchase.findFirst({
    where: and(eq(purchase.userId, userId), eq(purchase.courseId, courseId)),
    columns: { id: true },
    with: { tier: { columns: { name: true } } },
  });
}

/** True when the user may watch the lesson: an admin, a buyer of its course, or a free preview. */
export async function canWatchLesson(userId: string, admin: boolean, lessonId: string) {
  const row = await db.query.lesson.findFirst({ where: eq(lesson.id, lessonId), columns: { courseId: true, isPreview: true } });
  if (!row) return false;
  if (admin || row.isPreview) return true;
  return Boolean(await getPurchase(userId, row.courseId));
}

/**
 * Everything the dashboard shows: the user's courses (all courses for admins) with lessons,
 * videos, progress and notes.
 */
export async function getLibrary(userId: string, admin: boolean) {
  const owned = await db.query.purchase.findMany({
    where: eq(purchase.userId, userId),
    columns: { courseId: true },
    with: { tier: { columns: { name: true, privateLessons: true } } },
    orderBy: [asc(purchase.createdAt)],
  });
  const tierByCourse = new Map(owned.map((p) => [p.courseId, p.tier]));
  const courseIds = owned.map((p) => p.courseId);

  const courses = admin || courseIds.length
    ? await db.query.course.findMany({
        where: admin ? undefined : inArray(course.id, courseIds),
        columns: { id: true, title: true },
        with: {
          program: { columns: { title: true, sortOrder: true, published: true } },
          lessons: {
            orderBy: [asc(lesson.sortOrder), asc(lesson.createdAt)],
            columns: { id: true, title: true, description: true, durationMinutes: true, videoId: true, videoProvider: true },
          },
        },
        orderBy: [asc(course.sortOrder), asc(course.createdAt)],
      })
    : [];

  // Students see their courses in purchase order; admins see the catalog order.
  const order = new Map(courseIds.map((id, i) => [id, i]));
  courses.sort((a, b) =>
    admin
      ? a.program.sortOrder - b.program.sortOrder
      : (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
  );

  const lessonIds = courses.flatMap((c) => c.lessons.map((l) => l.id));
  const [progress, notes] = lessonIds.length
    ? await Promise.all([
        db
          .select({ lessonId: lessonProgress.lessonId })
          .from(lessonProgress)
          .where(and(eq(lessonProgress.userId, userId), inArray(lessonProgress.lessonId, lessonIds))),
        db
          .select({ lessonId: lessonNote.lessonId, body: lessonNote.body })
          .from(lessonNote)
          .where(and(eq(lessonNote.userId, userId), inArray(lessonNote.lessonId, lessonIds))),
      ])
    : [[], []];

  return {
    courses: courses.map((c) => ({
      id: c.id,
      title: c.title,
      programTitle: c.program.title,
      tier: tierByCourse.get(c.id) ?? null,
      lessons: c.lessons,
    })),
    completed: progress.map((p) => p.lessonId),
    notes: Object.fromEntries(notes.map((n) => [n.lessonId, n.body])),
  };
}

export type Library = Awaited<ReturnType<typeof getLibrary>>;
