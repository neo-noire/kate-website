"use client";

import type { FormEvent } from "react";
import { updateDemoState, useDemoState } from "@/lib/demo-store";
import { localizedValidation } from "@/lib/validation";
import { useI18n } from "./i18n-provider";
import { Modal } from "./modal";
import { useToast } from "./toast";

/** A message to the coach. Private sessions themselves are booked on a separate platform. */
export function ContactDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dict } = useI18n();
  const { user } = useDemoState();
  const toast = useToast();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    updateDemoState((state) => ({ ...state, feedback: { name: data.name, email: data.email, message: data.message } }));
    toast(dict.contact.saved);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} label={dict.contact.dialogLabel}>
      <div className="eyebrow">{dict.contact.eyebrow}</div>
      <h2>{dict.contact.title}</h2>
      <p className="sub">{dict.contact.sub}</p>
      <form className="formStack" onSubmit={submit} {...localizedValidation(dict)}>
        <label>
          {dict.common.name}
          <input name="name" required maxLength={60} defaultValue={user?.name ?? ""} />
        </label>
        <label>
          {dict.common.email}
          <input name="email" type="email" required defaultValue={user?.email ?? ""} />
        </label>
        <label>
          {dict.contact.message}
          <textarea name="message" placeholder={dict.contact.messagePlaceholder} required />
        </label>
        <button className="btn">{dict.contact.submit}</button>
        <p className="fine">{dict.contact.fine}</p>
      </form>
    </Modal>
  );
}
