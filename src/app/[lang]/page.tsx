import Image from "next/image";
import { ContactButton } from "@/components/contact-button";
import { NewsletterForm } from "@/components/newsletter-form";
import { PreviewLessonButton } from "@/components/preview-lesson-button";
import { ProgramCatalog } from "@/components/program-catalog";
import { dances } from "@/content/catalog";
import { getDictionary } from "@/i18n/server";
import heroPhoto from "@/assets/hero.jpg";

const tickerDances = (["cha-cha-cha", "samba", "rumba", "paso-doble", "jive"] as const).map((id) =>
  dances[id].name.toUpperCase(),
);

export default async function HomePage() {
  const { dict } = await getDictionary();

  return (
    <main>
      <section className="hero">
        <Image className="heroPhoto" src={heroPhoto} alt={dict.hero.photoAlt} preload sizes="(max-width: 640px) 100vw, 90vw" />
        <div className="wrap">
          <div className="eyebrow">{dict.hero.eyebrow}</div>
          <h1>
            {dict.hero.titleLine1}
            <br />
            {dict.hero.titleLine2}
            <span>{dict.hero.titleAccent}</span>
          </h1>
          <p>
            {dict.hero.lead1}
            <br />
            {dict.hero.lead2}
          </p>
          <div className="heroActions">
            <a href="#courses" className="btn">
              {dict.hero.choosePrograms} <span>↗</span>
            </a>
            <PreviewLessonButton />
          </div>
          <div className="heroBottom">
            {dict.hero.stats.map((stat, i) => (
              <span key={stat.value} style={i === dict.hero.stats.length - 1 ? { border: 0 } : undefined}>
                <b>{stat.value}</b>
                {stat.label}
              </span>
            ))}
          </div>
        </div>
        <div className="imageLabel">{dict.hero.imageLabel}</div>
      </section>

      <div className="ticker">
        {tickerDances.map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>

      <section className="section wrap" id="courses">
        <div className="heading">
          <div>
            <div className="eyebrow">{dict.catalog.eyebrow}</div>
            <h2>
              {dict.catalog.titleLine1}
              <br />
              {dict.catalog.titleLine2}
            </h2>
          </div>
          <p>
            {dict.catalog.intro.map((line, i) => (
              <span key={line}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
        </div>
        <ProgramCatalog />
        <p className="programNote">{dict.catalog.note}</p>
      </section>

      <section className="section wrap method" id="approach">
        <div>
          <div className="eyebrow">{dict.approach.eyebrow}</div>
          <h2>
            {dict.approach.titleLine1}
            <br />
            {dict.approach.titleLine2}
          </h2>
          <p>{dict.approach.body}</p>
          <ContactButton />
        </div>
        <div className="steps">
          {dict.approach.steps.map((step, i) => (
            <div className="step" key={step.title}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap" id="contact" style={{ scrollMarginTop: 110 }}>
        <div className="newsletter">
          <div>
            <h2>
              {dict.newsletter.titleLine1}
              <br />
              {dict.newsletter.titleLine2}
            </h2>
            <p>
              {dict.newsletter.body1}
              <br />
              {dict.newsletter.body2}
            </p>
          </div>
          <NewsletterForm />
        </div>
        <div className="faq">
          {dict.faq.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
