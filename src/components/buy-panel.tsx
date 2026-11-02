"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { EnrollButton } from "./enroll-button";
import { cn } from "@/lib/utils";

export type BuyPanelTier = {
  id: string;
  name: string;
  featured: boolean;
  /** Total price with HST, already formatted. */
  price: string;
  breakdown: { rate: number; hst: string; beforeTax: string };
  /** What the tier includes, then what it leaves out, both already localized. */
  items: { text: string; included: boolean }[];
  privateLessons: number;
};

type BuyPanelProps = {
  tiers: BuyPanelTier[];
  programTitle: string;
  courseTitle: string;
  courseId: string;
  lessonCount: number;
  paymentsEnabled: boolean;
};

/** Pick a format, see what it includes, and go to checkout. One panel instead of a card per tier. */
export function BuyPanel({ tiers, programTitle, courseTitle, courseId, lessonCount, paymentsEnabled }: BuyPanelProps) {
  const t = useTranslations("packages");
  const [selectedId, setSelectedId] = useState((tiers.find((tier) => tier.featured) ?? tiers[0]).id);
  const tier = tiers.find((candidate) => candidate.id === selectedId) ?? tiers[0];

  return (
    <aside className="overflow-hidden rounded-2xl border border-border bg-[var(--panel)] lg:sticky lg:top-6" aria-label={t("eyebrow")}>
      <div className="p-5">
        <div role="radiogroup" aria-label={t("eyebrow")} className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl border border-border bg-background p-1">
          {tiers.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={option.id === tier.id}
              onClick={() => setSelectedId(option.id)}
              className={cn(
                "relative rounded-lg px-1 py-2 text-[13px] font-bold text-muted-foreground transition-colors hover:text-foreground",
                option.id === tier.id && "bg-accent text-foreground ring-1 ring-white/20",
              )}
            >
              {option.name}
              {option.featured && (
                <span className="absolute -top-2 right-1 rounded-full bg-primary px-1.5 text-[9px] font-bold tracking-wider text-white uppercase">
                  {t("featured")}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-baseline gap-2">
          <span className="text-5xl leading-none font-black tracking-tight">{tier.price}</span>
          <small className="text-sm text-muted-foreground">{t("perCourse")}</small>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{t("taxIncluded", tier.breakdown)}</p>

        <ul className="mt-5 grid list-none gap-2.5 p-0 text-sm">
          {tier.items.map((item) => (
            <li key={item.text} className={cn("flex items-start gap-2.5", !item.included && "text-muted-foreground")}>
              {item.included ? (
                <Check size={14} aria-hidden className="mt-1 shrink-0 text-primary" />
              ) : (
                <X size={14} aria-hidden className="mt-1 shrink-0 text-muted-foreground" />
              )}
              <span className={cn(!item.included && "line-through decoration-muted-foreground/60")}>{item.text}</span>
              {!item.included && <span className="sr-only">{t("notIncluded")}</span>}
            </li>
          ))}
        </ul>
      </div>
      <div className="px-5 pb-5">
        {/* key remounts the button (and its dialog) when the format changes. */}
        <EnrollButton
          key={tier.id}
          className="btn w-full"
          programTitle={programTitle}
          courseTitle={courseTitle}
          tierName={tier.name}
          price={tier.price}
          breakdown={tier.breakdown}
          tierId={tier.id}
          courseId={courseId}
          paymentsEnabled={paymentsEnabled}
          lessonCount={lessonCount}
          privateLessons={tier.privateLessons}
          featured={tier.featured}
        />
      </div>
    </aside>
  );
}
