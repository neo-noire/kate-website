"use client";

import { useTranslations } from "next-intl";
import { ContactDialog } from "./contact-dialog";
import { useDialogState } from "./modal";

export function ContactButton() {
  const t = useTranslations("approach");
  const dialog = useDialogState();
  return (
    <>
      <button className="btn outline" style={{ marginTop: 24 }} onClick={dialog.show}>
        {t("cta")}
      </button>
      <ContactDialog open={dialog.open} onClose={dialog.close} />
    </>
  );
}
