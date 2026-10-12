"use client";

import { ArrowUpRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { courseKey, dances, getPackage, getProgram, type DanceId, type PackageId, type ProgramId } from "@/content/catalog";
import { useRouter } from "@/i18n/navigation";
import { updateDemoState } from "@/lib/demo-store";
import { Modal, useDialogState } from "./modal";
import { useToast } from "./toast";

type EnrollButtonProps = { programId: ProgramId; danceId: DanceId; packageId: PackageId; featured: boolean };

/**
 * Demo enrollment: no payment, the course is added to this browser's dashboard. Signed-out
 * visitors are sent to sign in first and land on the dashboard afterwards.
 */
export function EnrollButton({ programId, danceId, packageId, featured }: EnrollButtonProps) {
  const t = useTranslations();
  const format = useFormatter();
  const router = useRouter();
  const toast = useToast();
  const dialog = useDialogState();
  const program = getProgram(programId)!;
  const pkg = getPackage(packageId)!;
  const key = courseKey(programId, danceId);

  function enroll() {
    updateDemoState((state) => ({
      ...state,
      enrolled: { ...state.enrolled, [key]: { packageId, done: state.enrolled[key]?.done ?? [] } },
      current: { course: key, lesson: 0 },
    }));
    dialog.close();
    router.push("/dashboard");
    toast(t("enroll.success"));
  }

  return (
    <>
      <button className={`btn${featured ? "" : " outline"}`} onClick={dialog.show}>
        {t("packages.choose", { name: pkg.name })} <ArrowUpRight size={16} aria-hidden />
      </button>
      <Modal open={dialog.open} onClose={dialog.close} label={t("enroll.dialogLabel")}>
        <div className="eyebrow">{t("enroll.eyebrow")}</div>
        <h2>
          {dances[danceId].name} · {pkg.name}
        </h2>
        <p className="sub">
          {t("enroll.summary", { program: program.name, price: format.number(pkg.priceEur, "eur") })}
          <br />
          {pkg.privateLessons ? t("enroll.privateLessons", { count: pkg.privateLessons }) : t("enroll.independent")}
        </p>
        <button className="btn" onClick={enroll}>
          {t("enroll.submit")} <ArrowUpRight size={16} aria-hidden />
        </button>
        <p className="fine">{t("enroll.fine")}</p>
      </Modal>
    </>
  );
}
