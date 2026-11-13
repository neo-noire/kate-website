import Image from "next/image";
import { ArrowUpRight, Asterisk, Play } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { ContactButton } from "@/components/contact-button";
import { NewsletterForm } from "@/components/newsletter-form";
import { PreviewLessonButton } from "@/components/preview-lesson-button";
import { ProgramCatalog } from "@/components/program-catalog";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { localeAlternates } from "@/i18n/metadata";
import heroPhoto from "@/assets/hero.jpg";
import { getCatalog, getFeaturedPreview } from "@/lib/catalog/queries";
import { localize } from "@/lib/localized";
import { Button } from "@/components/ui/button";

const tickerDances = ["CHA-CHA-CHA", "SAMBA", "RUMBA", "PASO DOBLE", "JIVE"];

const heroStats = ["lessons", "formats", "pace"] as const;
const approachSteps = ["understand", "format", "complete"] as const;
const faqItems = ["startFrom", "progression", "levelSelection", "classes", "structure"] as const;

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: localeAlternates(await getLocale()) };
}

export default async function HomePage() {
  const [t, locale, catalog, preview] = await Promise.all([
    getTranslations(),
    getLocale(),
    getCatalog(),
    getFeaturedPreview(),
  ]);

  return (
    <main>
      <section className="hero">
        <Image
          className="heroPhoto"
          src={heroPhoto}
          alt={t("hero.photoAlt")}
          preload
          sizes="(max-width: 640px) 100vw, 90vw"
        />
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
            <Button asChild size="lg">
              <a href="#courses">
                {t("hero.choosePrograms")} <ArrowUpRight aria-hidden />
              </a>
            </Button>
            {preview && (
              <PreviewLessonButton
                videoId={preview.videoId}
                title={t("hero.previewTitle", {
                  title: localize(preview.title, locale),
                })}
              >
                <Play size={16} aria-hidden /> {t("hero.previewLesson")}
              </PreviewLessonButton>
            )}
          </div>
          <div className="heroBottom">
            {heroStats.map((key, i) => (
              <span
                key={key}
                style={i === heroStats.length - 1 ? { border: 0 } : undefined}
              >
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
          <span key={name}>
            <Asterisk size={14} aria-hidden />
            {name}
          </span>
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
        <ProgramCatalog programs={catalog} />
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
              <Markdown>{t(`faq.${key}.answer`)}</Markdown>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
