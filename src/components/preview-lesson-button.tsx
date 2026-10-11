"use client";

import { useTranslations } from "next-intl";
import { DEFAULT_COURSE } from "@/content/catalog";
import { useRouter } from "@/i18n/navigation";
import { updateDemoState } from "@/lib/demo-store";

/** Opens the dashboard on the first lesson of the free demo course. */
export function PreviewLessonButton() {
  const t = useTranslations("hero");
  const router = useRouter();
  return (
    <button
      className="btn outline"
      onClick={() => {
        updateDemoState((state) => ({
          ...state,
          enrolled: { ...state.enrolled, [DEFAULT_COURSE]: state.enrolled[DEFAULT_COURSE] ?? { packageId: "solo", done: [] } },
          current: { course: DEFAULT_COURSE, lesson: 0 },
        }));
        router.push("/dashboard");
      }}
    >
      {t("previewLesson")}
    </button>
  );
}
