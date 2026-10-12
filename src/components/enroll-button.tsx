"use client";

import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Modal, useDialogState } from "./modal";

type EnrollButtonProps = {
  programTitle: string;
  courseTitle: string;
  tierName: string;
  price: string;
  lessonCount: number;
  privateLessons: number;
  featured: boolean;
};

/** Chooses a tier. Checkout isn't connected yet, so the dialog says how to get access. */
export function EnrollButton({ programTitle, courseTitle, tierName, price, lessonCount, privateLessons, featured }: EnrollButtonProps) {
  const t = useTranslations();
  const dialog = useDialogState();

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
        <p className="fine">{t("enroll.comingSoon")}</p>
      </Modal>
    </>
  );
}
