import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A rounded row on the panel background: the shared look of admin cards. */
export function CardRow({ children, className }: { children: ReactNode; className?: string }) {
  return <li className={cn("flex items-center gap-3.5 rounded-xl border border-border bg-[var(--panel)] py-3 pr-3 pl-4", className)}>{children}</li>;
}

/** The square initial or number at the start of a card. */
export function Mark({ children }: { children: ReactNode }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-[10px] border border-border bg-secondary text-base font-black text-primary">
      {children}
    </span>
  );
}

export function SectionHeader({ title, hint, children }: { title: string; hint?: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="m-0 text-2xl font-black tracking-tight">{title}</h2>
        {hint && <p className="m-0 text-[13px] text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
