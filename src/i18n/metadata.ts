import type { Metadata } from "next";
import { defaultLocale, locales, type Locale } from "./config";

/** Canonical URL and hreflang links for a locale-independent path such as "/dashboard". */
export function localeAlternates(locale: Locale, path = ""): Metadata["alternates"] {
  const languages: Record<string, string> = Object.fromEntries(locales.map((l) => [l, `/${l}${path}`]));
  languages["x-default"] = `/${defaultLocale}${path}`;
  return { canonical: `/${locale}${path}`, languages };
}
