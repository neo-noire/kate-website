import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { routing } from "./routing";

export default getRequestConfig(async () => {
  // The locale is the root `[lang]` segment, which keeps every page statically renderable.
  const locale = await lang();
  if (!hasLocale(routing.locales, locale)) notFound();
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: "UTC",
  };
});
