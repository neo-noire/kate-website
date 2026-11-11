"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/** Shown inside the site's shell when a page throws; the header and footer stay. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errorPage");
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="section wrap">
      <div className="eyebrow">{t("eyebrow")}</div>
      <h1 style={{ fontSize: 42, letterSpacing: -1.7, margin: "12px 0 24px" }}>{t("title")}</h1>
      <p className="sub">{t("body")}</p>
      <div className="flex flex-wrap gap-3">
        <Button size="lg" onClick={reset}>
          {t("retry")}
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">{t("home")}</Link>
        </Button>
      </div>
    </main>
  );
}
