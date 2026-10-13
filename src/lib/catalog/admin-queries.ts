import "server-only";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { course, lesson, program, purchase, tier } from "@/db/schema";

// Admin reads are not cached: they include drafts and must show edits immediately.

export async function getAdminPrograms() {
  return db.query.program.findMany({
    orderBy: [asc(program.sortOrder), asc(program.createdAt)],
    columns: { id: true, slug: true, title: true, published: true },
    with: { courses: { columns: { id: true } }, tiers: { columns: { id: true } } },
  });
}

/** A program with everything the editor shows, including who has access to its courses. */
export async function getAdminProgram(id: string) {
  const row = await db.query.program.findFirst({
    where: eq(program.id, id),
    with: {
      courses: {
        orderBy: [asc(course.sortOrder), asc(course.createdAt)],
        with: { lessons: { orderBy: [asc(lesson.sortOrder), asc(lesson.createdAt)] } },
      },
      tiers: { orderBy: [asc(tier.sortOrder), asc(tier.createdAt)] },
    },
  });
  if (!row) return null;

  const courseIds = row.courses.map((c) => c.id);
  const purchases = courseIds.length
    ? await db.query.purchase.findMany({
        where: inArray(purchase.courseId, courseIds),
        orderBy: [desc(purchase.createdAt)],
        columns: { id: true, courseId: true, source: true, expiresAt: true, firstWatchedAt: true },
        with: { user: { columns: { name: true, email: true } }, tier: { columns: { name: true } } },
      })
    : [];
  return { ...row, purchases };
}

export type AdminProgram = NonNullable<Awaited<ReturnType<typeof getAdminProgram>>>;
