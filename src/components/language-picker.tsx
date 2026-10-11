"use client";

import { usePathname, useRouter } from "next/navigation";
import { LOCALE_COOKIE, localeLabels, locales, hasLocale } from "@/i18n/config";
import { BEFORE_LOCALE_CHANGE } from "@/lib/demo-store";
import { useI18n } from "./i18n-provider";

export function LanguagePicker() {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const router = useRouter();

  function change(next: string) {
    if (!hasLocale(next) || next === locale) return;
    window.dispatchEvent(new Event(BEFORE_LOCALE_CHANGE));
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    const rest = pathname.split("/").slice(2).join("/");
    // Each locale has its own root layout, so Next.js does a full page load here.
    router.push(`/${next}${rest ? `/${rest}` : ""}${window.location.search}${window.location.hash}`);
  }

  return (
    <select
      className="languagePicker"
      aria-label={dict.languageLabel}
      value={locale}
      onChange={(event) => change(event.target.value)}
    >
      {locales.map((value) => (
        <option key={value} value={value}>
          {localeLabels[value]}
        </option>
      ))}
    </select>
  );
}
