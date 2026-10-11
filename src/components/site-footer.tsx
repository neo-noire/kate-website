import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DemoDataButton } from "./demo-data-button";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  return (
    <footer>
      <div className="wrap">
        <Link className="brand" href="/">
          <i />
          RITMO
        </Link>
        <p>{t("copyright")}</p>
        <div style={{ display: "flex", gap: 20 }}>
          <DemoDataButton />
          <a href="https://unsplash.com/photos/POoF2Wv6ACU" target="_blank" rel="noopener">
            {t("photoCredit")}
          </a>
        </div>
      </div>
    </footer>
  );
}
