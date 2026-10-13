import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Fragment, type ReactNode } from "react";
import { business, getLegalDocument, LEGAL_DOCS, type LegalBlock, type LegalDoc } from "@/content/legal";
import { Link } from "@/i18n/navigation";

export async function LegalPage({ doc }: { doc: LegalDoc }) {
  const locale = await getLocale();
  const t = await getTranslations("legal");
  const format = await getFormatter();
  const page = getLegalDocument(locale, doc);
  const updated = format.dateTime(new Date(`${business.lastUpdated}T12:00:00Z`), { dateStyle: "long" });

  return (
    <main className="section wrap legal">
      <nav className="legalNav" aria-label={t("navLabel")}>
        {LEGAL_DOCS.map((other) => (
          <Link key={other} href={`/${other}`} aria-current={other === doc ? "page" : undefined}>
            {t(`nav.${other}`)}
          </Link>
        ))}
      </nav>
      <div className="eyebrow">{t("eyebrow")}</div>
      <h1>{page.title}</h1>
      <p className="legalUpdated">{t("lastUpdated", { date: updated })}</p>
      {!business.reviewed && <p className="legalDraft">{t("draft")}</p>}
      <p className="legalIntro">{withEmail(page.intro)}</p>
      {page.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.body.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </section>
      ))}
    </main>
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string") return <p>{withEmail(block)}</p>;
  return (
    <ul>
      {block.map((item) => (
        <li key={item}>{withEmail(item)}</li>
      ))}
    </ul>
  );
}

/** Turns the contact address into a mailto link once it is a real address. */
function withEmail(text: string): ReactNode {
  if (!business.email.includes("@")) return text;
  return text.split(business.email).map((part, i) => (
    <Fragment key={i}>
      {i > 0 && <a href={`mailto:${business.email}`}>{business.email}</a>}
      {part}
    </Fragment>
  ));
}
