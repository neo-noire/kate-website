"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { resetDemoState } from "@/lib/demo-store";
import { Modal, useDialogState } from "./modal";
import { useToast } from "./toast";

export function DemoDataButton() {
  const t = useTranslations("privacy");
  const tFooter = useTranslations("footer");
  const router = useRouter();
  const toast = useToast();
  const dialog = useDialogState();

  function clear() {
    resetDemoState();
    dialog.close();
    router.push("/");
    window.scrollTo(0, 0);
    toast(t("cleared"));
  }

  return (
    <>
      <button className="btn quiet" style={{ fontSize: 10, color: "var(--muted)" }} onClick={dialog.show}>
        {tFooter("demoData")}
      </button>
      <Modal open={dialog.open} onClose={dialog.close} label={t("dialogLabel")}>
        <div className="eyebrow">{t("eyebrow")}</div>
        <h2>{t("title")}</h2>
        <p className="sub">{t("body")}</p>
        <button className="btn outline" onClick={clear}>
          {t("clear")}
        </button>
      </Modal>
    </>
  );
}
