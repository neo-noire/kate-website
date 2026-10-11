"use client";

import { useState, type FormEvent } from "react";
import { updateDemoState } from "@/lib/demo-store";
import { localizedValidation } from "@/lib/validation";
import { useI18n } from "./i18n-provider";

export function NewsletterForm() {
  const { dict } = useI18n();
  const [subscribed, setSubscribed] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email"));
    updateDemoState((state) => ({ ...state, subscribed: email }));
    setSubscribed(true);
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={submit} {...localizedValidation(dict)}>
      <label htmlFor="subEmail">{dict.newsletter.emailLabel}</label>
      <div className="inputRow">
        <input id="subEmail" name="email" type="email" placeholder={dict.common.emailPlaceholder} required />
        <button className="btn" type="submit">
          {dict.newsletter.subscribe}
        </button>
      </div>
      <label className="checkLabel">
        <input type="checkbox" required />
        {dict.newsletter.consent}
      </label>
      <small>{dict.newsletter.demoNotice}</small>
      <p className="status" aria-live="polite">
        {subscribed ? dict.newsletter.success : ""}
      </p>
    </form>
  );
}
