"use client";

import { useTranslations } from "next-intl";
import type { FormEvent } from "react";
import { updateDemoState, useDemoState } from "@/lib/demo-store";
import { useLocalizedValidation } from "@/lib/validation";
import { Modal } from "./modal";
import { useToast } from "./toast";

/** A message to the coach. Private sessions themselves are booked on a separate platform. */
export function ContactDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations();
  const validation = useLocalizedValidation();
  const { user } = useDemoState();
  const toast = useToast();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    updateDemoState((state) => ({ ...state, feedback: { name: data.name, email: data.email, message: data.message } }));
    toast(t("contact.saved"));
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} label={t("contact.dialogLabel")}>
      <div className="eyebrow">{t("contact.eyebrow")}</div>
      <h2>{t("contact.title")}</h2>
      <p className="sub">{t("contact.sub")}</p>
      <form className="formStack" onSubmit={submit} {...validation}>
        <label>
          {t("common.name")}
          <input name="name" required maxLength={60} defaultValue={user?.name ?? ""} />
        </label>
        <label>
          {t("common.email")}
          <input name="email" type="email" required defaultValue={user?.email ?? ""} />
        </label>
        <label>
          {t("contact.message")}
          <textarea name="message" placeholder={t("contact.messagePlaceholder")} required />
        </label>
        <button className="btn">{t("contact.submit")}</button>
        <p className="fine">{t("contact.fine")}</p>
      </form>
    </Modal>
  );
}
