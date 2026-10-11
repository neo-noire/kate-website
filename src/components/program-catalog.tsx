"use client";

import Image from "next/image";
import Link from "next/link";
import heroPhoto from "@/assets/hero.jpg";
import { useState } from "react";
import { LESSONS_PER_DANCE, lowestPriceEur, programGroups, programs, type ProgramGroup } from "@/content/catalog";
import { format, formatEuro, plural } from "@/i18n/format";
import { useI18n } from "./i18n-provider";

const COLLAPSED_COUNT = 3;

export function ProgramCatalog() {
  const { locale, dict } = useI18n();
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
            {dict.catalog.groups[group]}
          </button>
        ))}
      </div>
      <div className="programs">
        {visible.map((program) => {
          const copy = dict.programs[program.id];
          return (
            <article className="program" key={program.id}>
              <div className="art">
                <Image src={heroPhoto} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 400px" />
                <span className="pill">{copy.tag}</span>
                <span className="num">{program.number}</span>
              </div>
              <div className="programBody">
                <h3>{program.name}</h3>
                <p>{copy.description}</p>
                <div className="meta">
                  <span>{plural(locale, program.danceIds.length, dict.catalog.dances)}</span>
                  <span>{plural(locale, program.danceIds.length * LESSONS_PER_DANCE, dict.catalog.lessons)}</span>
                  <span>{dict.catalog.online}</span>
                </div>
                <div className="cardBottom">
                  <span>{format(dict.catalog.fromPrice, { price: formatEuro(locale, lowestPriceEur) })}</span>
                  <Link
                    className="arrow"
                    href={`/${locale}/programs/${program.id}`}
                    aria-label={format(dict.catalog.open, { name: program.name })}
                  >
                    ↗
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
            {expanded ? dict.catalog.showLess : dict.catalog.showMore}
          </button>
        </div>
      )}
    </>
  );
}
