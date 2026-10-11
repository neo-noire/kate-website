"use client";

import { ContactDialog } from "./contact-dialog";
import { useI18n } from "./i18n-provider";
import { useDialogState } from "./modal";

export function ContactButton() {
  const { dict } = useI18n();
  const dialog = useDialogState();
  return (
    <>
      <button className="btn outline" style={{ marginTop: 24 }} onClick={dialog.show}>
        {dict.approach.cta}
      </button>
      <ContactDialog open={dialog.open} onClose={dialog.close} />
    </>
  );
}
