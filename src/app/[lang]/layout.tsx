import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ToastProvider } from "@/components/toast";
import { localeAlternates } from "@/i18n/metadata";
import { routing } from "@/i18n/routing";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: { default: t("title"), template: `%s · RITMO` },
    description: t("description"),
    alternates: localeAlternates(await getLocale()),
  };
}

export const viewport: Viewport = { themeColor: "#111111" };

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  const t = await getTranslations();
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <ToastProvider>
            <div className="demoBar">{t("demoBar")}</div>
            <SiteHeader />
            {children}
            <SiteFooter />
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
