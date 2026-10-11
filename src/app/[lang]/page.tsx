import Image from "next/image";
import { ContactButton } from "@/components/contact-button";
import { NewsletterForm } from "@/components/newsletter-form";
import { PreviewLessonButton } from "@/components/preview-lesson-button";
import { ProgramCatalog } from "@/components/program-catalog";
import { dances } from "@/content/catalog";
import { getTranslations } from "next-intl/server";
import heroPhoto from "@/assets/hero.jpg";

const tickerDances = (["cha-cha-cha", "samba", "rumba", "paso-doble", "jive"] as const).map((id) =>
  dances[id].name.toUpperCase(),
);

const heroStats = ["lessons", "formats", "pace"] as const;
const approachSteps = ["understand", "format", "complete"] as const;
const faqItems = ["partner", "singleDance", "privateLessons"] as const;

export default async function HomePage() {
  const t = await getTranslations();

  return (
    <main>
      <section className="hero">
        <Image className="heroPhoto" src={heroPhoto} alt={t("hero.photoAlt")} preload sizes="(max-width: 640px) 100vw, 90vw" />
        <div className="wrap">
          <div className="eyebrow">{t("hero.eyebrow")}</div>
          <h1>
            {t("hero.titleLine1")}
            <br />
            {t("hero.titleLine2")}
            <span>{t("hero.titleAccent")}</span>
          </h1>
          <p>
            {t("hero.lead1")}
            <br />
            {t("hero.lead2")}
          </p>
          <div className="heroActions">
            <a href="#courses" className="btn">
              {t("hero.choosePrograms")} <span>↗</span>
            </a>
            <PreviewLessonButton />
          </div>
          <div className="heroBottom">
            {heroStats.map((key, i) => (
              <span key={key} style={i === heroStats.length - 1 ? { border: 0 } : undefined}>
                <b>{t(`hero.stats.${key}.value`)}</b>
                {t(`hero.stats.${key}.label`)}
              </span>
            ))}
          </div>
        </div>
        <div className="imageLabel">{t("hero.imageLabel")}</div>
      </section>

      <div className="ticker">
        {tickerDances.map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>

      <section className="section wrap" id="courses">
        <div className="heading">
          <div>
            <div className="eyebrow">{t("catalog.eyebrow")}</div>
            <h2>
              {t("catalog.titleLine1")}
              <br />
              {t("catalog.titleLine2")}
            </h2>
          </div>
          <p>
            {t("catalog.intro.line1")}
            <br />
            {t("catalog.intro.line2")}
            <br />
            {t("catalog.intro.line3")}
          </p>
        </div>
        <ProgramCatalog />
        <p className="programNote">{t("catalog.note")}</p>
      </section>

      <section className="section wrap method" id="approach">
        <div>
          <div className="eyebrow">{t("approach.eyebrow")}</div>
          <h2>
            {t("approach.titleLine1")}
            <br />
            {t("approach.titleLine2")}
          </h2>
          <p>{t("approach.body")}</p>
          <ContactButton />
        </div>
        <div className="steps">
          {approachSteps.map((key, i) => (
            <div className="step" key={key}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3>{t(`approach.steps.${key}.title`)}</h3>
                <p>{t(`approach.steps.${key}.body`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap" id="contact" style={{ scrollMarginTop: 110 }}>
        <div className="newsletter">
          <div>
            <h2>
              {t("newsletter.titleLine1")}
              <br />
              {t("newsletter.titleLine2")}
            </h2>
            <p>
              {t("newsletter.body1")}
              <br />
              {t("newsletter.body2")}
            </p>
          </div>
          <NewsletterForm />
        </div>
        <div className="faq">
          {faqItems.map((key) => (
            <details key={key}>
              <summary>{t(`faq.${key}.question`)}</summary>
              <p>{t(`faq.${key}.answer`)}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
