import type { Locale } from "./config";

/** Plural forms follow Intl.PluralRules categories; Ukrainian uses one, few and many. */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

/** Replace `{name}` placeholders with values. */
export function format(template: string, values: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/** Pick the plural form for `count` and fill `{count}` plus any other placeholders. */
export function plural(
  locale: Locale,
  count: number,
  forms: PluralForms,
  values: Record<string, string | number> = {},
): string {
  const category = new Intl.PluralRules(locale).select(count);
  return format(forms[category] ?? forms.other, { count, ...values });
}

export function formatEuro(locale: Locale, amount: number): string {
  return new Intl.NumberFormat(locale === "uk" ? "uk-UA" : "en-IE", {
    style: "currency",
    currency: "EUR",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(amount);
}
