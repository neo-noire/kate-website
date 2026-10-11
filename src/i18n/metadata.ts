import type { Metadata } from "next";
import { routing, type Locale } from "./routing";

/** Canonical URL and hreflang links for a locale-independent path such as "/dashboard". */
export function localeAlternates(locale: Locale, path = ""): Metadata["alternates"] {
  const languages: Record<string, string> = Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`]));
  languages["x-default"] = `/${routing.defaultLocale}${path}`;
  return { canonical: `/${locale}${path}`, languages };
}
