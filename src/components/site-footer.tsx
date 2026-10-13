import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LEGAL_DOCS } from "@/content/legal";
import { DemoDataButton } from "./demo-data-button";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tLegal = await getTranslations("legal");
  return (
    <footer>
      <div className="wrap">
        <Link className="brand" href="/">
          <i />
          RITMO
        </Link>
        <p>{t("copyright")}</p>
        <nav className="footerLinks" aria-label={tLegal("navLabel")}>
          {LEGAL_DOCS.map((doc) => (
            <Link key={doc} href={`/${doc}`}>
              {tLegal(`nav.${doc}`)}
            </Link>
          ))}
        </nav>
        <div style={{ display: "flex", gap: 20 }}>
          <DemoDataButton />
          <a href="https://unsplash.com/photos/POoF2Wv6ACU" target="_blank" rel="noopener">
            {t("photoCredit")} <ExternalLink size={12} aria-hidden />
          </a>
        </div>
      </div>
    </footer>
  );
}
