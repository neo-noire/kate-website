"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { updateDemoState } from "@/lib/demo-store";
import { useLocalizedValidation } from "@/lib/validation";

export function NewsletterForm() {
  const t = useTranslations();
  const validation = useLocalizedValidation();
  const [subscribed, setSubscribed] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email"));
    updateDemoState((state) => ({ ...state, subscribed: email }));
    setSubscribed(true);
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={submit} {...validation}>
      <label htmlFor="subEmail">{t("newsletter.emailLabel")}</label>
      <div className="inputRow">
        <input id="subEmail" name="email" type="email" placeholder={t("common.emailPlaceholder")} required />
        <button className="btn" type="submit">
          {t("newsletter.subscribe")}
        </button>
      </div>
      <label className="checkLabel">
        <input type="checkbox" required />
        {t("newsletter.consent")}
      </label>
      <small>{t("newsletter.demoNotice")}</small>
      <p className="status" aria-live="polite">
        {subscribed ? t("newsletter.success") : ""}
      </p>
    </form>
  );
}
