import { relations } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

// Tables required by Better Auth (email + password, plus the extra `role` field on user). Property names are the field names
// Better Auth expects; column names are snake_case.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  /** "admin" can edit the catalog and grant access; everyone else is "student". */
  role: text("role").notNull().default("student"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// Course catalog. A program (e.g. "Beginner 1.0") holds courses, one per dance, and each course
// holds lessons. Students buy one course at one of the program's pricing tiers. Text that
// students read is stored per language as { en, uk }, with English required.

/** Text in each site language; English is required, other languages fall back to it. */
export type Localized = { en: string } & Partial<Record<string, string>>;

const localized = (name: string) => jsonb(name).$type<Localized>();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const program = pgTable("program", {
  id: text("id").primaryKey(),
  /** URL segment, e.g. "beginner-1". */
  slug: text("slug").notNull().unique(),
  title: localized("title").notNull(),
  description: localized("description"),
  /** Short label on the catalog card, e.g. "START HERE". */
  tag: localized("tag"),
  /** Catalog filter, e.g. "Beginner"; programs with the same English category share a filter. */
  category: localized("category"),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const course = pgTable(
  "course",
  {
    id: text("id").primaryKey(),
    programId: text("program_id")
      .notNull()
      .references(() => program.id, { onDelete: "cascade" }),
    /** URL segment within its program, e.g. "samba". */
    slug: text("slug").notNull(),
    title: localized("title").notNull(),
    description: localized("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("course_program_slug_idx").on(table.programId, table.slug)],
);

export const tier = pgTable(
  "tier",
  {
    id: text("id").primaryKey(),
    programId: text("program_id")
      .notNull()
      .references(() => program.id, { onDelete: "cascade" }),
    name: localized("name").notNull(),
    /** Price of one course at this tier before HST, in the currency's minor unit (cents). HST is added on top. */
    priceCents: integer("price_cents").notNull(),
    /** ISO 4217 code, e.g. "CAD". */
    currency: text("currency").notNull().default("CAD"),
    privateLessons: integer("private_lessons").notNull().default(0),
    privateLessonMinutes: integer("private_lesson_minutes").notNull().default(50),
    /** Extra benefits, one per line. */
    features: localized("features"),
    /** Highlighted as the recommended tier. */
    featured: boolean("featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("tier_program_id_idx").on(table.programId)],
);

export const lesson = pgTable(
  "lesson",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    title: localized("title").notNull(),
    description: localized("description"),
    /** Where the video is hosted; only "youtube" for now. */
    videoProvider: text("video_provider").notNull().default("youtube"),
    /** The provider's video id. Only sent to students who own the course, unless a preview. */
    videoId: text("video_id"),
    durationMinutes: integer("duration_minutes"),
    /** Free preview: anyone can watch it on the course page. */
    isPreview: boolean("is_preview").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("lesson_course_id_idx").on(table.courseId)],
);

export const purchase = pgTable(
  "purchase",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    /** Null when the tier was deleted after purchase; access to the course remains. */
    tierId: text("tier_id").references(() => tier.id, { onDelete: "set null" }),
    /** "admin" for access granted by hand; "stripe" for a paid checkout. */
    source: text("source").notNull(),
    /** The Stripe Checkout Session that paid for the current access period; makes fulfillment idempotent. */
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    /** The Stripe payment, so a refund in Stripe can end access. */
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    /** What the student paid, HST included, in minor units; null for access granted by hand. */
    amountCents: integer("amount_cents"),
    /** The HST part of amountCents. */
    taxCents: integer("tax_cents"),
    currency: text("currency"),
    /** When access ends. Purchases last ACCESS_MONTHS (src/lib/catalog/access.ts); null never expires. */
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    /** The first time the student played a paid lesson of the course; decides refund eligibility. */
    firstWatchedAt: timestamp("first_watched_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("purchase_user_course_idx").on(table.userId, table.courseId),
    index("purchase_course_id_idx").on(table.courseId),
    index("purchase_payment_intent_idx").on(table.stripePaymentIntentId),
  ],
);

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.lessonId] })],
);

export const lessonNote = pgTable(
  "lesson_note",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    updatedAt: updatedAt(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.lessonId] })],
);

export const programRelations = relations(program, ({ many }) => ({
  courses: many(course),
  tiers: many(tier),
}));

export const courseRelations = relations(course, ({ one, many }) => ({
  program: one(program, { fields: [course.programId], references: [program.id] }),
  lessons: many(lesson),
  purchases: many(purchase),
}));

export const tierRelations = relations(tier, ({ one }) => ({
  program: one(program, { fields: [tier.programId], references: [program.id] }),
}));

export const lessonRelations = relations(lesson, ({ one }) => ({
  course: one(course, { fields: [lesson.courseId], references: [course.id] }),
}));

export const purchaseRelations = relations(purchase, ({ one }) => ({
  user: one(user, { fields: [purchase.userId], references: [user.id] }),
  course: one(course, { fields: [purchase.courseId], references: [course.id] }),
  tier: one(tier, { fields: [purchase.tierId], references: [tier.id] }),
}));

/** Messages sent through the site's contact form; admins read them on the admin page. */
export const contactMessage = pgTable(
  "contact_message",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    message: text("message").notNull(),
    locale: text("locale").notNull(),
    /** The signed-in account that sent it, if any. */
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (table) => [index("contact_message_created_at_idx").on(table.createdAt)],
);

/** Newsletter sign-ups. Emails are sent through Resend once it is connected. */
export const newsletterSubscriber = pgTable("newsletter_subscriber", {
  email: text("email").primaryKey(),
  locale: text("locale").notNull(),
  createdAt: createdAt(),
});
