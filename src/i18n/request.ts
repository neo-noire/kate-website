import { hasLocale, type Formats } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { routing } from "./routing";

export const formats = {
  number: {
    // Prototype prices are illustrative euros; €39 in English, 39 € in Ukrainian.
    eur: { style: "currency", currency: "EUR", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 },
  },
} satisfies Formats;

export default getRequestConfig(async () => {
  // The locale is the root `[lang]` segment, which keeps every page statically renderable.
  const locale = await lang();
  if (!hasLocale(routing.locales, locale)) notFound();
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    formats,
    timeZone: "UTC",
  };
});
