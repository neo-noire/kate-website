"use client";

import { Play } from "lucide-react";
import type { ReactNode } from "react";
import { Modal, useDialogState } from "./modal";
import { YouTubePlayer } from "./youtube-player";

type PreviewLessonButtonProps = {
  videoId: string;
  /** The video's title, also the dialog's accessible name. */
  title: string;
  className?: string;
  /** Button content; defaults to a play icon labelled with the title. */
  children?: ReactNode;
};

/** Plays a free preview lesson in a dialog. */
export function PreviewLessonButton({ videoId, title, className = "btn outline", children }: PreviewLessonButtonProps) {
  const dialog = useDialogState();
  return (
    <>
      <button className={className} onClick={dialog.show} aria-label={children ? undefined : title}>
        {children ?? <Play size={16} aria-hidden />}
      </button>
      <Modal open={dialog.open} onClose={dialog.close} label={title}>
        <h2 className="previewTitle">{title}</h2>
        <YouTubePlayer videoId={videoId} title={title} />
      </Modal>
    </>
  );
}
