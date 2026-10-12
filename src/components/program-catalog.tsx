"use client";

import Image from "next/image";
import { ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";
import heroPhoto from "@/assets/hero.jpg";
import { useState } from "react";
import { LESSONS_PER_DANCE, lowestPriceEur, programGroups, programs, type ProgramGroup } from "@/content/catalog";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const COLLAPSED_COUNT = 3;

export function ProgramCatalog() {
  const t = useTranslations();
  const format = useFormatter();
  const [filter, setFilter] = useState<ProgramGroup | "all">("all");
  const [expanded, setExpanded] = useState(false);

  const visible = programs
    .filter((p) => filter === "all" || p.group === filter)
    .filter((_, i) => filter !== "all" || expanded || i < COLLAPSED_COUNT);

  return (
    <>
      <div className="filters">
        {(["all", ...programGroups] as const).map((group) => (
          <button
            key={group}
            className={`chip${filter === group ? " active" : ""}`}
            aria-pressed={filter === group}
            onClick={() => setFilter(group)}
          >
            {t(`catalog.groups.${group}`)}
          </button>
        ))}
      </div>
      <div className="programs">
        {visible.map((program) => {
          return (
            <article className="program" key={program.id}>
              <div className="art">
                <Image src={heroPhoto} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 400px" />
                <span className="pill">{t(`programs.${program.id}.tag`)}</span>
                <span className="num">{program.number}</span>
              </div>
              <div className="programBody">
                <h3>{program.name}</h3>
                <p>{t(`programs.${program.id}.description`)}</p>
                <div className="meta">
                  <span>{t("catalog.dances", { count: program.danceIds.length })}</span>
                  <span>{t("catalog.lessons", { count: program.danceIds.length * LESSONS_PER_DANCE })}</span>
                  <span>{t("catalog.online")}</span>
                </div>
                <div className="cardBottom">
                  <span>{t("catalog.fromPrice", { price: format.number(lowestPriceEur, "eur") })}</span>
                  <Link
                    className="arrow"
                    href={`/programs/${program.id}`}
                    aria-label={t("catalog.open", { name: program.name })}
                  >
                    <ArrowUpRight size={18} aria-hidden />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {filter === "all" && (
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
