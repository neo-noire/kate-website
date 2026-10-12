"use client";

import { useFormatter, useTranslations } from "next-intl";
import type { FormEvent } from "react";
import { courseKey, dances, getPackage, getProgram, type DanceId, type PackageId, type ProgramId } from "@/content/catalog";
import { useRouter } from "@/i18n/navigation";
import { updateDemoState, useDemoState } from "@/lib/demo-store";
import { useLocalizedValidation } from "@/lib/validation";
import { Modal, useDialogState } from "./modal";
import { useToast } from "./toast";

type EnrollButtonProps = { programId: ProgramId; danceId: DanceId; packageId: PackageId; featured: boolean };

/** Demo enrollment: no payment, the course is added to this browser's dashboard. */
export function EnrollButton({ programId, danceId, packageId, featured }: EnrollButtonProps) {
  const t = useTranslations();
  const format = useFormatter();
  const validation = useLocalizedValidation();
  const router = useRouter();
  const toast = useToast();
  const dialog = useDialogState();
  const { user } = useDemoState();
  const program = getProgram(programId)!;
  const pkg = getPackage(packageId)!;
  const key = courseKey(programId, danceId);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name")).trim() || t("enroll.defaultName");
    updateDemoState((state) => ({
      ...state,
      user: { name, email: String(data.get("email")) },
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
        {t("packages.choose", { name: pkg.name })}
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
        <form className="formStack" onSubmit={submit} {...validation}>
          <label>
            {t("common.name")}
            <input
              name="name"
              autoComplete="given-name"
              placeholder={t("enroll.namePlaceholder")}
              maxLength={60}
              required
              defaultValue={user?.name ?? ""}
            />
          </label>
          <label>
            {t("common.email")}
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={t("common.emailPlaceholder")}
              defaultValue={user?.email ?? ""}
            />
          </label>
          <button className="btn" type="submit">
            {t("enroll.submit")}
          </button>
          <p className="fine">{t("enroll.fine")}</p>
        </form>
      </Modal>
    </>
  );
}
