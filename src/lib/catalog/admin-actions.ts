"use server";

import { count, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { db } from "@/db";
import { course, lesson, program, purchase, tier, user, type Localized } from "@/db/schema";
import { redirect } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { NotAuthorizedError, requireAdmin } from "@/lib/auth/session";
import { CURRENCIES, parsePriceToCents } from "@/lib/money";
import { parseYouTubeId } from "@/lib/youtube";
import { accessExpiry } from "./access";
import type { FormError, FormState } from "./form-state";
import { CATALOG_TAG } from "./queries";

// Every action checks the caller is an admin, validates the form, writes, and expires the
// public catalog cache so pages show the change on the next request.

class FieldError extends Error {
  constructor(
    readonly key: FormError,
    readonly field?: string,
  ) {
    super(key);
  }
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function readText(form: FormData, name: string, { required = false, max = 200 } = {}) {
  const value = String(form.get(name) ?? "").trim().slice(0, max);
  if (required && !value) throw new FieldError("required", name);
  return value;
}

/** A per-language field submitted as `name.en`, `name.uk`, ... English is the required one. */
function readLocalized(form: FormData, name: string, opts: { required: true; max?: number }): Localized;
function readLocalized(form: FormData, name: string, opts?: { required?: false; max?: number }): Localized | null;
function readLocalized(form: FormData, name: string, { required = false, max = 200 } = {}) {
  const values = Object.fromEntries(
    routing.locales.map((locale) => [locale, readText(form, `${name}.${locale}`, { max })]),
  ) as Record<Locale, string>;
  const filled = Object.values(values).some(Boolean);
  if ((required || filled) && !values.en) throw new FieldError("required", `${name}.en`);
  if (!filled) return null;
  return Object.fromEntries(Object.entries(values).filter(([, v]) => v)) as Localized;
}

function readInt(form: FormData, name: string, { min = 0, max = 100_000, optional = false } = {}) {
  const raw = readText(form, name);
  if (!raw && optional) return null;
  const value = Number(raw || 0);
  if (!Number.isInteger(value) || value < min || value > max) throw new FieldError("number", name);
  return value;
}

const readBool = (form: FormData, name: string) => form.get(name) === "on";

function readSlug(form: FormData, name = "slug") {
  const value = readText(form, name, { required: true, max: 80 }).toLowerCase();
  if (!SLUG.test(value)) throw new FieldError("slug", name);
  return value;
}

function readId(form: FormData, name = "id") {
  const value = readText(form, name);
  if (!value) throw new FieldError("notFound");
  return value;
}

function readLocale(form: FormData): Locale {
  const value = form.get("locale");
  return routing.locales.find((l) => l === value) ?? routing.defaultLocale;
}

const newId = () => crypto.randomUUID();

/** Runs an admin write and turns failures into a form result. */
async function run(write: () => Promise<unknown>): Promise<FormState> {
  const at = Date.now();
  try {
    await requireAdmin();
    await write();
  } catch (error) {
    if (error instanceof FieldError) return { error: error.key, field: error.field, at };
    if (error instanceof NotAuthorizedError) return { error: "forbidden", at };
    const code = (error as { cause?: { code?: string } }).cause?.code ?? (error as { code?: string }).code;
    if (code === "23505") return { error: "slugTaken", field: "slug", at };
    console.error("Admin action failed", error);
    return { error: "generic", at };
  }
  updateTag(CATALOG_TAG);
  return { ok: true, at };
}

// Programs

export async function createProgram(_: FormState, form: FormData): Promise<FormState> {
  const id = newId();
  const result = await run(async () => {
    const [{ total }] = await db.select({ total: count() }).from(program);
    await db.insert(program).values({
      id,
      slug: readSlug(form),
      title: readLocalized(form, "title", { required: true }),
      sortOrder: total,
    });
  });
  if (result.ok) redirect({ href: `/admin/programs/${id}`, locale: readLocale(form) });
  return result;
}

export async function updateProgram(_: FormState, form: FormData): Promise<FormState> {
  return run(() =>
    db
      .update(program)
      .set({
        slug: readSlug(form),
        title: readLocalized(form, "title", { required: true }),
        description: readLocalized(form, "description", { max: 2000 }),
        tag: readLocalized(form, "tag", { max: 40 }),
        category: readLocalized(form, "category", { max: 40 }),
        sortOrder: readInt(form, "sortOrder", { max: 9999 })!,
        published: readBool(form, "published"),
      })
      .where(eq(program.id, readId(form))),
  );
}

export async function deleteProgram(_: FormState, form: FormData): Promise<FormState> {
  const result = await run(() => db.delete(program).where(eq(program.id, readId(form))));
  if (result.ok) redirect({ href: "/admin", locale: readLocale(form) });
  return result;
}

// Tiers

function tierValues(form: FormData) {
  const priceCents = parsePriceToCents(readText(form, "price", { required: true }));
  if (priceCents === null) throw new FieldError("price", "price");
  const currency = readText(form, "currency");
  return {
    name: readLocalized(form, "name", { required: true, max: 60 }),
    priceCents,
    currency: CURRENCIES.find((c) => c === currency) ?? CURRENCIES[0],
    privateLessons: readInt(form, "privateLessons", { max: 100 })!,
    privateLessonMinutes: readInt(form, "privateLessonMinutes", { min: 1, max: 600 })!,
    features: readLocalized(form, "features", { max: 2000 }),
    featured: readBool(form, "featured"),
    sortOrder: readInt(form, "sortOrder", { max: 9999 })!,
  };
}

export async function createTier(_: FormState, form: FormData): Promise<FormState> {
  return run(() => db.insert(tier).values({ id: newId(), programId: readId(form, "programId"), ...tierValues(form) }));
}

export async function updateTier(_: FormState, form: FormData): Promise<FormState> {
  return run(() => db.update(tier).set(tierValues(form)).where(eq(tier.id, readId(form))));
}

export async function deleteTier(_: FormState, form: FormData): Promise<FormState> {
  return run(() => db.delete(tier).where(eq(tier.id, readId(form))));
}

// Courses (one dance within a program)

function courseValues(form: FormData) {
  return {
    slug: readSlug(form),
    title: readLocalized(form, "title", { required: true }),
    description: readLocalized(form, "description", { max: 2000 }),
    sortOrder: readInt(form, "sortOrder", { max: 9999 })!,
  };
}

export async function createCourse(_: FormState, form: FormData): Promise<FormState> {
  return run(() => db.insert(course).values({ id: newId(), programId: readId(form, "programId"), ...courseValues(form) }));
}

export async function updateCourse(_: FormState, form: FormData): Promise<FormState> {
  return run(() => db.update(course).set(courseValues(form)).where(eq(course.id, readId(form))));
}

export async function deleteCourse(_: FormState, form: FormData): Promise<FormState> {
  return run(() => db.delete(course).where(eq(course.id, readId(form))));
}

// Lessons

function lessonValues(form: FormData) {
  const video = readText(form, "video", { max: 300 });
  const videoId = video ? parseYouTubeId(video) : null;
  if (video && !videoId) throw new FieldError("youtube", "video");
  return {
    title: readLocalized(form, "title", { required: true }),
    description: readLocalized(form, "description", { max: 4000 }),
    videoProvider: "youtube",
    videoId,
    durationMinutes: readInt(form, "durationMinutes", { min: 1, max: 600, optional: true }),
    isPreview: readBool(form, "isPreview"),
    sortOrder: readInt(form, "sortOrder", { max: 9999 })!,
  };
}

export async function createLesson(_: FormState, form: FormData): Promise<FormState> {
  return run(() => db.insert(lesson).values({ id: newId(), courseId: readId(form, "courseId"), ...lessonValues(form) }));
}

export async function updateLesson(_: FormState, form: FormData): Promise<FormState> {
  return run(() => db.update(lesson).set(lessonValues(form)).where(eq(lesson.id, readId(form))));
}

export async function deleteLesson(_: FormState, form: FormData): Promise<FormState> {
  return run(() => db.delete(lesson).where(eq(lesson.id, readId(form))));
}

// Access

/** Gives a registered user a course at a tier, or changes their tier if they already have it. */
export async function grantAccess(_: FormState, form: FormData): Promise<FormState> {
  return run(async () => {
    const email = readText(form, "email", { required: true, max: 254 }).toLowerCase();
    if (!email.includes("@")) throw new FieldError("email", "email");
    const courseId = readId(form, "courseId");
    const tierId = readText(form, "tierId") || null;
    const student = await db.query.user.findFirst({ where: eq(user.email, email), columns: { id: true } });
    if (!student) throw new FieldError("userNotFound", "email");
    await db
      .insert(purchase)
      .values({ id: newId(), userId: student.id, courseId, tierId, source: "admin", expiresAt: accessExpiry() })
      // Granting again renews access for another full period.
      .onConflictDoUpdate({
        target: [purchase.userId, purchase.courseId],
        set: { tierId, expiresAt: accessExpiry(), updatedAt: new Date() },
      });
  });
}

export async function revokeAccess(_: FormState, form: FormData): Promise<FormState> {
  return run(() => db.delete(purchase).where(eq(purchase.id, readId(form))));
}
