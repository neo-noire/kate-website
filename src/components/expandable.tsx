"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Clamps long content to a few lines with a fade and a "Read more" toggle. Short content is shown as is. */
export function Expandable({ children, collapsedHeight = 150 }: { children: ReactNode; collapsedHeight?: number }) {
  const t = useTranslations("packages");
  const content = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const element = content.current;
    if (element) setOverflows(element.scrollHeight > collapsedHeight + 24);
  }, [children, collapsedHeight]);

  const clamped = overflows && !open;

  return (
    <div>
      <div
        ref={content}
        className={cn("relative overflow-hidden", clamped && "after:absolute after:inset-x-0 after:bottom-0 after:h-16 after:bg-gradient-to-b after:from-transparent after:to-background")}
        style={{ maxHeight: clamped ? collapsedHeight : undefined }}
      >
        {children}
      </div>
      {overflows && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-primary"
        >
          {open ? t("showLess") : t("readMore")}
          <ChevronDown size={14} aria-hidden className={cn("transition-transform", open && "rotate-180")} />
        </button>
      )}
    </div>
  );
}
