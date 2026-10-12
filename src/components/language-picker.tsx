"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeLabels, routing } from "@/i18n/routing";
import { BEFORE_LOCALE_CHANGE } from "@/lib/demo-store";
import { hasLocale } from "next-intl";

export function LanguagePicker() {
  const locale = useLocale();
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();

  function change(next: string) {
    if (!hasLocale(routing.locales, next) || next === locale) return;
    window.dispatchEvent(new Event(BEFORE_LOCALE_CHANGE));
    // Each locale has its own root layout, so this is a full page load. next-intl
    // remembers the choice in the NEXT_LOCALE cookie.
    router.replace(`${pathname}${window.location.search}${window.location.hash}`, { locale: next });
  }

  return (
    <select
      className="languagePicker"
      aria-label={t("languageLabel")}
      value={locale}
      onChange={(event) => change(event.target.value)}
    >
      {routing.locales.map((value) => (
        <option key={value} value={value}>
          {localeLabels[value]}
        </option>
      ))}
    </select>
  );
}
