"use client";

import type { FormEvent } from "react";
import { updateDemoState } from "@/lib/demo-store";
import { localizedValidation } from "@/lib/validation";
import { useI18n } from "./i18n-provider";
import { Modal } from "./modal";

export function LoginDialog({ open, onClose, onSignedIn }: { open: boolean; onClose: () => void; onSignedIn: () => void }) {
  const { dict } = useI18n();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name")).trim() || dict.enroll.defaultName;
    updateDemoState((state) => ({ ...state, user: { name, email: String(data.get("email")) } }));
    onClose();
    onSignedIn();
  }

  return (
    <Modal open={open} onClose={onClose} label={dict.login.dialogLabel}>
      <div className="eyebrow">{dict.login.eyebrow}</div>
      <h2>{dict.login.title}</h2>
      <p className="sub">{dict.login.body}</p>
      <form className="formStack" onSubmit={submit} {...localizedValidation(dict)}>
        <label>
          {dict.common.name}
          <input name="name" autoComplete="given-name" maxLength={60} placeholder={dict.login.namePlaceholder} required />
        </label>
        <label>
          {dict.common.email}
          <input name="email" type="email" autoComplete="email" placeholder={dict.common.emailPlaceholder} required />
        </label>
        <button className="btn">{dict.login.submit}</button>
        <p className="fine">{dict.login.fine}</p>
      </form>
    </Modal>
  );
}
