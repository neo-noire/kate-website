"use client";

import { ArrowUpRight, Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { startCheckout } from "@/lib/checkout-actions";
import { Modal, useDialogState } from "./modal";

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
}: EnrollButtonProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dialog = useDialogState();
  const [checkout, pay] = useActionState(startCheckout, { failed: false });

  return (
    <>
      <button className={`btn${featured ? "" : " outline"}`} onClick={dialog.show}>
        {t("packages.choose", { name: tierName })} <ArrowUpRight size={16} aria-hidden />
      </button>
      <Modal open={dialog.open} onClose={dialog.close} label={t("enroll.dialogLabel")}>
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
            <PayButton label={t("enroll.pay", { price })} />
            <p className="fine" role={checkout.failed ? "alert" : undefined}>
              {checkout.failed ? t("enroll.failed") : t("enroll.secure")}
            </p>
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
    <button className="btn" type="submit" disabled={pending} aria-busy={pending}>
      <Lock size={16} aria-hidden /> {label}
    </button>
  );
}
