"use client";

import Image from "next/image";
import { ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";
import heroPhoto from "@/assets/hero.jpg";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CatalogProgram } from "@/lib/catalog/queries";
import { localize } from "@/lib/localized";
import { formatPrice, withHst } from "@/lib/money";

const COLLAPSED_COUNT = 3;

/** Category filter key: the English category, so translations can't split a filter. */
const categoryKey = (program: CatalogProgram) => program.category?.en.trim() || null;

export function ProgramCatalog({ programs }: { programs: CatalogProgram[] }) {
  const t = useTranslations();
  const locale = useLocale();

  function formatDuration(totalMinutes: number) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (!hours) return t("catalog.durationMinutes", { minutes });
    if (!minutes) return t("catalog.durationHours", { hours });
    return t("catalog.durationHoursMinutes", { hours, minutes });
  }
  const [filter, setFilter] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (!programs.length) return <p className="fine">{t("catalog.empty")}</p>;

  // One filter per category, labelled in the current language, in catalog order.
  const categories = new Map<string, string>();
  for (const program of programs) {
    const key = categoryKey(program);
    if (key && !categories.has(key)) categories.set(key, localize(program.category!, locale));
  }

  const inFilter = programs.filter((p) => filter === null || categoryKey(p) === filter);
  const visible = filter === null && !expanded ? inFilter.slice(0, COLLAPSED_COUNT) : inFilter;

  return (
    <>
      {categories.size > 1 && (
        <div className="filters">
          {[[null, t("catalog.all")] as const, ...categories].map(([key, label]) => (
            <button
              key={key ?? "all"}
              className={`chip${filter === key ? " active" : ""}`}
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <div className="programs">
        {visible.map((program) => {
          const title = localize(program.title, locale);
          const tag = localize(program.tag, locale);
          const sameCategory = programs.filter((p) => categoryKey(p) === categoryKey(program));
          const number = String(sameCategory.indexOf(program) + 1).padStart(2, "0");
          return (
            <article className="program" key={program.id}>
              <div className="art">
                <Image src={heroPhoto} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 400px" />
                {tag && <span className="pill">{tag}</span>}
                <span className="num">{number}</span>
              </div>
              <div className="programBody">
                <h3>{title}</h3>
                <p>{localize(program.description, locale)}</p>
                <div className="meta">
                  {program.courseCount > 1 && <span>{t("catalog.dances", { count: program.courseCount })}</span>}
                  <span>{t("catalog.lessons", { count: program.lessonCount })}</span>
                  {program.totalMinutes > 0 && <span>{formatDuration(program.totalMinutes)}</span>}
                  <span>{t("catalog.online")}</span>
                </div>
                <div className="cardBottom">
                  <span>
                    {program.fromPrice
                      ? t("catalog.fromPrice", {
                          price: formatPrice(withHst(program.fromPrice.priceCents).total, program.fromPrice.currency, locale),
                        })
                      : null}
                  </span>
                  <Link className="arrow" href={`/programs/${program.slug}`} aria-label={t("catalog.open", { name: title })}>
                    <ArrowUpRight size={18} aria-hidden />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {filter === null && programs.length > COLLAPSED_COUNT && (
        <div style={{ textAlign: "center", marginTop: 26 }}>
          <button className="btn outline" onClick={() => setExpanded((value) => !value)}>
            {expanded ? t("catalog.showLess") : t("catalog.showMore")}
            {expanded ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
          </button>
        </div>
      )}
    </>
  );
}
