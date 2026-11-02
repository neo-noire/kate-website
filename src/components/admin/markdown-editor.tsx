"use client";

import { Bold, Heading2, Italic, List, ListOrdered, Quote, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Markdown } from "@/components/markdown";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Format = { key: "bold" | "italic" | "heading" | "bulletList" | "numberedList" | "quote"; icon: LucideIcon; wrap?: string; prefix?: string };

const FORMATS: Format[] = [
  { key: "bold", icon: Bold, wrap: "**" },
  { key: "italic", icon: Italic, wrap: "_" },
  { key: "heading", icon: Heading2, prefix: "## " },
  { key: "bulletList", icon: List, prefix: "- " },
  { key: "numberedList", icon: ListOrdered, prefix: "1. " },
  { key: "quote", icon: Quote, prefix: "> " },
];

type MarkdownEditorProps = { id: string; name: string; defaultValue: string; required?: boolean };

/** A textarea with a formatting toolbar and a rendered preview. The textarea stays mounted so the form still submits it. */
export function MarkdownEditor({ id, name, defaultValue, required }: MarkdownEditorProps) {
  const t = useTranslations("admin.markdown");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewText, setPreviewText] = useState(defaultValue);

  function showPreview(show: boolean) {
    if (show) setPreviewText(textarea.current?.value ?? "");
    setPreviewing(show);
  }

  function format({ wrap, prefix }: Format) {
    const field = textarea.current;
    if (!field) return;
    const selected = field.value.slice(field.selectionStart, field.selectionEnd) || "text";
    const formatted = wrap
      ? `${wrap}${selected}${wrap}`
      : selected
          .split("\n")
          .map((line) => `${prefix}${line}`)
          .join("\n");
    field.setRangeText(formatted, field.selectionStart, field.selectionEnd, "select");
    field.focus();
  }

  return (
    <div className="overflow-hidden rounded-md border border-input">
      <div className="flex items-center justify-between gap-2 border-b border-input bg-background px-2">
        <div role="tablist" className="flex">
          {[false, true].map((isPreview) => (
            <button
              key={String(isPreview)}
              type="button"
              role="tab"
              aria-selected={previewing === isPreview}
              onClick={() => showPreview(isPreview)}
              className={cn(
                "-mb-px border-b-2 border-transparent px-3 py-2 text-xs font-bold text-muted-foreground",
                previewing === isPreview && "border-primary text-foreground",
              )}
            >
              {t(isPreview ? "preview" : "write")}
            </button>
          ))}
        </div>
        {!previewing && (
          <div className="flex">
            {FORMATS.map((item) => (
              <button
                key={item.key}
                type="button"
                title={t(item.key)}
                aria-label={t(item.key)}
                onClick={() => format(item)}
                className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <item.icon size={14} aria-hidden />
              </button>
            ))}
          </div>
        )}
      </div>
      <Textarea
        ref={textarea}
        id={id}
        name={name}
        defaultValue={defaultValue}
        required={required}
        rows={8}
        hidden={previewing}
        className="min-h-40 rounded-none border-0 font-mono text-[13px] leading-6 whitespace-pre-wrap shadow-none focus-visible:ring-0"
      />
      {previewing && (
        <div className="min-h-40 px-3 py-2 text-sm">
          {previewText.trim() ? <Markdown>{previewText}</Markdown> : <p className="text-muted-foreground">{t("empty")}</p>}
        </div>
      )}
      <p className="border-t border-input bg-background px-3 py-1.5 text-xs text-muted-foreground">{t("hint")}</p>
    </div>
  );
}
