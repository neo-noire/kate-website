import type { Locale } from "@/i18n/routing";

/** Every language is required, so a missing translation fails the type check, not the page. */
export type ByLocale<T> = Record<Locale, T>;

export type TierCopy = {
  /** Small label above the tier name, e.g. "+ 1 private session". */
  tagline: string;
  /** Who the tier is for. */
  description: string;
  /** Shown in the card's "How it works" toggle. */
  howItWorks?: string;
  /** What the tier includes, one line each. */
  included: string[];
  /** What other tiers have that this one does not. Shown crossed out. */
  notIncluded: string[];
};

export type CourseCopy = {
  /** The course description shown on the program page, as markdown. */
  about: string;
};

/**
 * The words of one program. Prices, ids and order live in the database; copy lives here and is
 * matched by key: the program's slug, the course's slug, and the tier's `key` field in the admin.
 */
export type ProgramContent = {
  courses: Record<string, ByLocale<CourseCopy>>;
  tiers: Record<string, ByLocale<TierCopy>>;
};
