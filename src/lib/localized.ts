import type { Localized } from "@/db/schema";

export type { Localized };

/** The text in `locale`, falling back to English when that language is missing or blank. */
export function localize(value: Localized, locale: string): string;
export function localize(value: Localized | null | undefined, locale: string): string | undefined;
export function localize(value: Localized | null | undefined, locale: string) {
  if (!value) return undefined;
  return value[locale]?.trim() || value.en;
}

/** Lines of a multi-line localized field, without blank lines. */
export function localizeLines(value: Localized | null | undefined, locale: string): string[] {
  return (localize(value, locale) ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
