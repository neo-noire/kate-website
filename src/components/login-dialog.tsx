"use client";

import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FormEvent } from "react";
import { updateDemoState } from "@/lib/demo-store";
import { useLocalizedValidation } from "@/lib/validation";
import { Modal } from "./modal";

export function LoginDialog({ open, onClose, onSignedIn }: { open: boolean; onClose: () => void; onSignedIn: () => void }) {
  const t = useTranslations();
  const validation = useLocalizedValidation();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name")).trim() || t("enroll.defaultName");
    updateDemoState((state) => ({ ...state, user: { name, email: String(data.get("email")) } }));
    onClose();
    onSignedIn();
  }

  return (
    <Modal open={open} onClose={onClose} label={t("login.dialogLabel")}>
      <div className="eyebrow">{t("login.eyebrow")}</div>
      <h2>{t("login.title")}</h2>
      <p className="sub">{t("login.body")}</p>
      <form className="formStack" onSubmit={submit} {...validation}>
        <label>
          {t("common.name")}
          <input name="name" autoComplete="given-name" maxLength={60} placeholder={t("login.namePlaceholder")} required />
        </label>
        <label>
          {t("common.email")}
          <input name="email" type="email" autoComplete="email" placeholder={t("common.emailPlaceholder")} required />
        </label>
        <button className="btn">{t("login.submit")} <ArrowUpRight size={16} aria-hidden /></button>
        <p className="fine">{t("login.fine")}</p>
      </form>
    </Modal>
  );
}
