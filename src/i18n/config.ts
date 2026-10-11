export const locales = ["en", "uk"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** Cookie that remembers an explicit language choice. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** Short labels for the language picker. Ukrainian is shown as UA, as in the prototype. */
export const localeLabels: Record<Locale, string> = { en: "EN", uk: "UA" };

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
