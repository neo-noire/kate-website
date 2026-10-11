import Link from "next/link";
import { getDictionary } from "@/i18n/server";
import { DemoDataButton } from "./demo-data-button";

export async function SiteFooter() {
  const { locale, dict } = await getDictionary();
  return (
    <footer>
      <div className="wrap">
        <Link className="brand" href={`/${locale}`}>
          <i />
          RITMO
        </Link>
        <p>{dict.footer.copyright}</p>
        <div style={{ display: "flex", gap: 20 }}>
          <DemoDataButton />
          <a href="https://unsplash.com/photos/POoF2Wv6ACU" target="_blank" rel="noopener">
            {dict.footer.photoCredit}
          </a>
        </div>
      </div>
    </footer>
  );
}
