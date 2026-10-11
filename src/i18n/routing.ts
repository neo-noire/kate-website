import { defineRouting } from "next-intl/routing";

// To add a language: add its code here, add a label below, and add messages/<code>.json.
export const routing = defineRouting({
  locales: ["en", "uk"],
  defaultLocale: "en",
  // hreflang links come from page metadata (see metadata.ts), not response headers.
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];

/** Short labels for the language picker. Ukrainian is shown as UA, as in the prototype. */
export const localeLabels: Record<Locale, string> = { en: "EN", uk: "UA" };
