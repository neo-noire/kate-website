"use client";

import { Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { playLesson } from "@/lib/catalog/student-actions";
import { useToast } from "./toast";
import { YouTubePlayer } from "./youtube-player";

/**
 * A lesson's video behind a play button. The video id is fetched on play, which records the
 * student's first play of the course (it ends refund eligibility).
 */
export function LessonVideo({ lessonId, title }: { lessonId: string; title: string }) {
  const t = useTranslations("dashboard");
  const toast = useToast();
  const [videoId, setVideoId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (videoId) return <YouTubePlayer videoId={videoId} title={title} autoplay />;

  return (
    <div className="videoFrame videoPoster">
      <button
        className="playButton"
        disabled={pending}
        aria-label={t("play", { title })}
        onClick={() =>
          startTransition(async () => {
            const id = await playLesson(lessonId);
            if (id) setVideoId(id);
            else toast(t("playError"));
          })
        }
      >
        <Play size={34} aria-hidden />
      </button>
    </div>
  );
}
