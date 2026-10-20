import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LEGAL_DOCS } from "@/content/legal";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tLegal = await getTranslations("legal");
  return (
    <footer>
      <div className="wrap">
        <Link className="brand" href="/">
          <div>
            <span className="text-primary">Latin</span>
            <span>Kate</span>
          </div>
        </Link>
        <p>{t("copyright")}</p>
        <nav className="footerLinks" aria-label={tLegal("navLabel")}>
          {LEGAL_DOCS.map((doc) => (
            <Link key={doc} href={`/${doc}`}>
              {tLegal(`nav.${doc}`)}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
