"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { courseKey, dances, getPackage, getProgram, type DanceId, type PackageId, type ProgramId } from "@/content/catalog";
import { format, formatEuro, plural } from "@/i18n/format";
import { updateDemoState, useDemoState } from "@/lib/demo-store";
import { localizedValidation } from "@/lib/validation";
import { useI18n } from "./i18n-provider";
import { Modal, useDialogState } from "./modal";
import { useToast } from "./toast";

type EnrollButtonProps = { programId: ProgramId; danceId: DanceId; packageId: PackageId; featured: boolean };

/** Demo enrollment: no payment, the course is added to this browser's dashboard. */
export function EnrollButton({ programId, danceId, packageId, featured }: EnrollButtonProps) {
  const { locale, dict } = useI18n();
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
    const name = String(data.get("name")).trim() || dict.enroll.defaultName;
    updateDemoState((state) => ({
      ...state,
      user: { name, email: String(data.get("email")) },
      enrolled: { ...state.enrolled, [key]: { packageId, done: state.enrolled[key]?.done ?? [] } },
      current: { course: key, lesson: 0 },
    }));
    dialog.close();
    router.push(`/${locale}/dashboard`);
    toast(dict.enroll.success);
  }

  return (
    <>
      <button className={`btn${featured ? "" : " outline"}`} onClick={dialog.show}>
        {format(dict.packages.choose, { name: pkg.name })}
      </button>
      <Modal open={dialog.open} onClose={dialog.close} label={dict.enroll.dialogLabel}>
        <div className="eyebrow">{dict.enroll.eyebrow}</div>
        <h2>
          {dances[danceId].name} · {pkg.name}
        </h2>
        <p className="sub">
          {format(dict.enroll.summary, { program: program.name, price: formatEuro(locale, pkg.priceEur) })}
          <br />
          {pkg.privateLessons ? plural(locale, pkg.privateLessons, dict.enroll.privateLessons) : dict.enroll.independent}
        </p>
        <form className="formStack" onSubmit={submit} {...localizedValidation(dict)}>
          <label>
            {dict.common.name}
            <input
              name="name"
              autoComplete="given-name"
              placeholder={dict.enroll.namePlaceholder}
              maxLength={60}
              required
              defaultValue={user?.name ?? ""}
            />
          </label>
          <label>
            {dict.common.email}
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={dict.common.emailPlaceholder}
              defaultValue={user?.email ?? ""}
            />
          </label>
          <button className="btn" type="submit">
            {dict.enroll.submit}
          </button>
          <p className="fine">{dict.enroll.fine}</p>
        </form>
      </Modal>
    </>
  );
}
