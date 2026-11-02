"use client";

import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { ContactDialog } from "./contact-dialog";
import { useDialogState } from "./modal";
import { Button } from "@/components/ui/button";

export function ContactButton() {
  const t = useTranslations("approach");
  const dialog = useDialogState();
  return (
    <>
      <Button variant="outline" size="lg" className="mt-6" onClick={dialog.show}>
        {t("cta")} <ArrowUpRight aria-hidden />
      </Button>
      <ContactDialog open={dialog.open} onClose={dialog.close} />
    </>
  );
}
