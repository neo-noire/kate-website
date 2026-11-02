"use client";

import { ArrowUpRight, Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { startCheckout } from "@/lib/checkout-actions";
import { Modal, useDialogState } from "./modal";
import { Button } from "@/components/ui/button";

type EnrollButtonProps = {
  programTitle: string;
  courseTitle: string;
  tierName: string;
  price: string;
  /** The price before tax and the HST added to it, already formatted. */
  breakdown: { rate: number; hst: string; beforeTax: string };
  tierId: string;
  courseId: string;
  /** False until the Stripe keys are set; the dialog then says payment isn't open yet. */
  paymentsEnabled: boolean;
  lessonCount: number;
  privateLessons: number;
  featured: boolean;
  /** Overrides the default button style. */
  className?: string;
};

/** Chooses a tier and goes on to Stripe Checkout. */
export function EnrollButton({
  programTitle,
  courseTitle,
  tierName,
  price,
  breakdown,
  tierId,
  courseId,
  paymentsEnabled,
  lessonCount,
  privateLessons,
  featured,
  className,
}: EnrollButtonProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dialog = useDialogState();
  const [checkout, pay] = useActionState(startCheckout, { failed: false });

  return (
    <>
      <Button variant={featured ? "default" : "outline"} size="lg" className={className} onClick={dialog.show}>
        {t("packages.choose", { name: tierName })} <ArrowUpRight aria-hidden />
      </Button>
      <Modal open={dialog.open} onClose={dialog.close} label={t("enroll.dialogLabel")} size="sm">
        <div className="eyebrow">{t("enroll.eyebrow")}</div>
        <h2>
          {courseTitle} · {tierName}
        </h2>
        <p className="sub">
          {t("enroll.summary", { program: programTitle, lessons: t("packages.videoLessons", { count: lessonCount }), price })}
          <br />
          {privateLessons ? t("enroll.privateLessons", { count: privateLessons }) : t("enroll.independent")}
        </p>
        <dl className="priceBreakdown">
          <dt>{t("enroll.beforeTax")}</dt>
          <dd>{breakdown.beforeTax}</dd>
          <dt>{t("enroll.hst", { rate: breakdown.rate })}</dt>
          <dd>{breakdown.hst}</dd>
          <dt>{t("enroll.total")}</dt>
          <dd>{price}</dd>
        </dl>
        {paymentsEnabled ? (
          <form action={pay}>
            <input type="hidden" name="tierId" value={tierId} />
            <input type="hidden" name="courseId" value={courseId} />
            <input type="hidden" name="locale" value={locale} />
            <div className="modalFooter">
              <PayButton label={t("enroll.pay", { price })} />
              <p className="fine" role={checkout.failed ? "alert" : undefined}>
                {checkout.failed ? t("enroll.failed") : t("enroll.secure")}
              </p>
            </div>
          </form>
        ) : (
          <p className="legalDraft" role="status">
            {t("enroll.comingSoon")}
          </p>
        )}
      </Modal>
    </>
  );
}

function PayButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending} aria-busy={pending}>
      <Lock aria-hidden /> {label}
    </Button>
  );
}
