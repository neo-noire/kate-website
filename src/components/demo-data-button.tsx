"use client";

import { useRouter } from "next/navigation";
import { resetDemoState } from "@/lib/demo-store";
import { useI18n } from "./i18n-provider";
import { Modal, useDialogState } from "./modal";
import { useToast } from "./toast";

export function DemoDataButton() {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const dialog = useDialogState();

  function clear() {
    resetDemoState();
    dialog.close();
    router.push(`/${locale}`);
    window.scrollTo(0, 0);
    toast(dict.privacy.cleared);
  }

  return (
    <>
      <button className="btn quiet" style={{ fontSize: 10, color: "var(--muted)" }} onClick={dialog.show}>
        {dict.footer.demoData}
      </button>
      <Modal open={dialog.open} onClose={dialog.close} label={dict.privacy.dialogLabel}>
        <div className="eyebrow">{dict.privacy.eyebrow}</div>
        <h2>{dict.privacy.title}</h2>
        <p className="sub">{dict.privacy.body}</p>
        <button className="btn outline" onClick={clear}>
          {dict.privacy.clear}
        </button>
      </Modal>
    </>
  );
}
