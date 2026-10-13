"use client";

import { ArrowUpRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition, type FormEvent } from "react";
import { subscribeToNewsletter } from "@/lib/site-actions";
import { useLocalizedValidation } from "@/lib/validation";
import { Honeypot } from "./honeypot";

export function NewsletterForm() {
  const t = useTranslations();
  const locale = useLocale();
  const validation = useLocalizedValidation();
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const data = new FormData(formElement);
    startTransition(async () => {
      const ok = await subscribeToNewsletter({
        email: String(data.get("email")),
        website: String(data.get("website") ?? ""),
        locale,
      });
      setStatus(ok ? "done" : "error");
      if (ok) formElement.reset();
    });
  }

  return (
    <form onSubmit={submit} {...validation}>
      <label htmlFor="subEmail">{t("newsletter.emailLabel")}</label>
      <div className="inputRow">
        <input id="subEmail" name="email" type="email" placeholder={t("common.emailPlaceholder")} required />
        <button className="btn" type="submit" disabled={pending}>
          {t("newsletter.subscribe")} <ArrowUpRight size={16} aria-hidden />
        </button>
      </div>
      <Honeypot />
      <label className="checkLabel">
        <input type="checkbox" required />
        {t("newsletter.consent")}
      </label>
      <p className="status" aria-live="polite">
        {status === "done" ? t("newsletter.success") : status === "error" ? t("newsletter.error") : ""}
      </p>
    </form>
  );
}
