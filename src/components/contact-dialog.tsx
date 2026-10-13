"use client";

import { ArrowUpRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { sendContactMessage } from "@/lib/site-actions";
import { useLocalizedValidation } from "@/lib/validation";
import { Honeypot } from "./honeypot";
import { Modal } from "./modal";
import { useToast } from "./toast";

/** A message to the coach. Private sessions themselves are booked on a separate platform. */
export function ContactDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations();
  const validation = useLocalizedValidation();
  const user = authClient.useSession().data?.user;
  const toast = useToast();
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    startTransition(async () => {
      if (await sendContactMessage({ ...data, name: data.name, email: data.email, message: data.message, locale })) {
        toast(t("contact.sent"));
        onClose();
      } else {
        toast(t("contact.error"));
      }
    });
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
          <textarea name="message" maxLength={5000} placeholder={t("contact.messagePlaceholder")} required />
        </label>
        <Honeypot />
        <button className="btn" disabled={pending}>
          {t("contact.submit")} <ArrowUpRight size={16} aria-hidden />
        </button>
        <p className="fine">{t("contact.fine")}</p>
      </form>
    </Modal>
  );
}
