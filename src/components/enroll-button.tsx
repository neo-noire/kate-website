"use client";

import { ArrowUpRight, Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { type PromoPreview, previewPromo, startCheckout } from "@/lib/checkout-actions";
import { formatPrice } from "@/lib/money";
import { Modal, useDialogState } from "./modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EnrollButtonProps = {
  programTitle: string;
  courseTitle: string;
  tierName: string;
  price: string;
  /** The price before tax and the HST added to it, already formatted. */
  breakdown: { rate: number; hst: string; beforeTax: string };
  tierId: string;
  courseId: string;
  /** The tier's currency, for showing a promo discount. */
  currency: string;
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
  currency,
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
  const [preview, applyPromo] = useActionState(previewPromo, {} as PromoPreview);
  const applied = preview.code ? preview : null;
  const money = (cents: number) => formatPrice(cents, currency, locale);

  // Signing in sends visitors back here with ?enroll=<tierId>; reopen the dialog they were in.
  const { show } = dialog;
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("enroll") === tierId) show();
  }, [tierId]); // eslint-disable-line react-hooks/exhaustive-deps

  function closeDialog() {
    dialog.close();
    const url = new URL(window.location.href);
    if (!url.searchParams.has("enroll")) return;
    url.searchParams.delete("enroll");
    window.history.replaceState(null, "", url);
  }

  return (
    <>
      <Button variant={featured ? "default" : "outline"} size="lg" className={className} onClick={dialog.show}>
        {t("packages.choose", { name: tierName })} <ArrowUpRight aria-hidden />
      </Button>
      <Modal open={dialog.open} onClose={closeDialog} label={t("enroll.dialogLabel")} size="sm">
        <div className="eyebrow">{t("enroll.eyebrow")}</div>
        <h2>
          {courseTitle} · {tierName}
        </h2>
        <p className="sub">
          {t("enroll.summary", { program: programTitle, lessons: t("packages.videoLessons", { count: lessonCount }), price })}
          <br />
          {privateLessons ? t("enroll.privateLessons", { count: privateLessons }) : t("enroll.independent")}
        </p>
        {paymentsEnabled && (
          <PromoForm tierId={tierId} courseId={courseId} locale={locale} preview={preview} action={applyPromo} />
        )}
        <dl className="priceBreakdown">
          <dt>{t("enroll.beforeTax")}</dt>
          <dd>{applied ? money(applied.beforeTaxCents! + applied.discountCents!) : breakdown.beforeTax}</dd>
          {applied && (
            <>
              <dt>{t("enroll.promo.discount", { code: applied.code! })}</dt>
              <dd>−{money(applied.discountCents!)}</dd>
            </>
          )}
          <dt>{t("enroll.hst", { rate: breakdown.rate })}</dt>
          <dd>{applied ? money(applied.hstCents!) : breakdown.hst}</dd>
          <dt>{t("enroll.total")}</dt>
          <dd>{applied ? money(applied.totalCents!) : price}</dd>
        </dl>
        {paymentsEnabled ? (
          <form action={pay}>
            <input type="hidden" name="tierId" value={tierId} />
            <input type="hidden" name="courseId" value={courseId} />
            <input type="hidden" name="locale" value={locale} />
            {applied && <input type="hidden" name="promo" value={applied.code} />}
            <div className="modalFooter">
              <PayButton label={t("enroll.pay", { price: applied ? money(applied.totalCents!) : price })} />
              <p className="fine" role={checkout.failed || checkout.promoProblem ? "alert" : undefined}>
                {checkout.promoProblem
                  ? t(`enroll.promo.problems.${checkout.promoProblem}`)
                  : checkout.failed
                    ? t("enroll.failed")
                    : t("enroll.secure")}
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

/** The "Promo code" field above the price. A code in the page address (?promo=KATE10) fills it in. */
function PromoForm({
  tierId,
  courseId,
  locale,
  preview,
  action,
}: {
  tierId: string;
  courseId: string;
  locale: string;
  preview: PromoPreview;
  action: (form: FormData) => void;
}) {
  const t = useTranslations("enroll.promo");
  const [initial] = useState(() => new URLSearchParams(window.location.search).get("promo") ?? "");
  return (
    <form action={action} className="mb-5 grid gap-1.5">
      <input type="hidden" name="tierId" value={tierId} />
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="locale" value={locale} />
      <label htmlFor="promo" className="text-xs text-muted-foreground">
        {t("label")}
      </label>
      <div className="flex gap-2">
        <Input id="promo" name="promo" defaultValue={initial} autoComplete="off" autoCapitalize="characters" spellCheck={false} />
        <ApplyButton label={t("apply")} />
      </div>
      <p className={preview.problem ? "m-0 text-xs text-red-400" : "m-0 text-xs text-muted-foreground"} role="status">
        {preview.problem ? t(`problems.${preview.problem}`) : preview.code ? t("applied", { code: preview.code }) : ""}
      </p>
    </form>
  );
}

function ApplyButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {label}
    </Button>
  );
}
