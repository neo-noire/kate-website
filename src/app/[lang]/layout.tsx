import type { Metadata, Viewport } from "next";
import { I18nProvider } from "@/components/i18n-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ToastProvider } from "@/components/toast";
import { locales } from "@/i18n/config";
import { localeAlternates } from "@/i18n/metadata";
import { getDictionary } from "@/i18n/server";
import "../globals.css";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getDictionary();
  return {
    title: { default: dict.meta.title, template: `%s · RITMO` },
    description: dict.meta.description,
    alternates: localeAlternates(locale),
  };
}

export const viewport: Viewport = { themeColor: "#111111" };

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const { locale, dict } = await getDictionary();
  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale} dict={dict}>
          <ToastProvider>
            <div className="demoBar">{dict.demoBar}</div>
            <SiteHeader />
            {children}
            <SiteFooter />
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
