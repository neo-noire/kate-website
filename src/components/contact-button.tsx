"use client";

import { BookingDialog } from "./booking-dialog";
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
      <BookingDialog open={dialog.open} onClose={dialog.close} />
    </>
  );
}
