import type { Locale } from "@/i18n/routing";
import { introLatin1 } from "./intro-latin-1";
import type { CourseCopy, ProgramContent, TierCopy } from "./types";

/** Add a program here after creating its file. The key is the program's slug. */
const programs: Record<string, ProgramContent> = {
  "intro-latin-1": introLatin1,
};

export function getCourseCopy(programSlug: string, courseSlug: string, locale: Locale): CourseCopy | undefined {
  return programs[programSlug]?.courses[courseSlug]?.[locale];
}

export function getTierCopy(programSlug: string, tierKey: string | null, locale: Locale): TierCopy | undefined {
  return tierKey ? programs[programSlug]?.tiers[tierKey]?.[locale] : undefined;
}
