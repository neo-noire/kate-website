"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { localeLabels, routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LanguagePicker() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();

  function change(next: string) {
    if (!hasLocale(routing.locales, next) || next === locale) return;
    // Each locale has its own root layout, so this is a full page load. next-intl
    // remembers the choice in the NEXT_LOCALE cookie.
    // The path is read at click time rather than with usePathname, which would keep the header
    // out of the static shell of pages with dynamic segments.
    const { pathname, search, hash } = window.location;
    const path = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), "") || "/";
    router.replace(`${path}${search}${hash}`, { locale: next });
  }

  return (
    <Select value={locale} onValueChange={change}>
      <SelectTrigger size="sm" className="w-[4.5rem] font-bold" aria-label={t("languageLabel")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {routing.locales.map((value) => (
          <SelectItem key={value} value={value}>
            {localeLabels[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
