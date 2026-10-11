"use client";

import { useRouter } from "next/navigation";
import { DEFAULT_COURSE } from "@/content/catalog";
import { updateDemoState } from "@/lib/demo-store";
import { useI18n } from "./i18n-provider";

/** Opens the dashboard on the first lesson of the free demo course. */
export function PreviewLessonButton() {
  const { locale, dict } = useI18n();
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
        router.push(`/${locale}/dashboard`);
      }}
    >
      {dict.hero.previewLesson}
    </button>
  );
}
