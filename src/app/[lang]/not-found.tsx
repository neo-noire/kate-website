import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <main className="section wrap">
      <div className="eyebrow">404</div>
      <h1 style={{ fontSize: 42, letterSpacing: -1.7, margin: "12px 0 24px" }}>{t("title")}</h1>
      <Button asChild variant="outline" size="lg">
        <Link href="/">{t("back")}</Link>
      </Button>
    </main>
  );
}
