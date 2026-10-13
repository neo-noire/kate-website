import { youTubeEmbedUrl } from "@/lib/youtube";

/** A 16:9 YouTube embed. */
export function YouTubePlayer({ videoId, title, autoplay = false }: { videoId: string; title: string; autoplay?: boolean }) {
  return (
    <div className="videoFrame">
      <iframe
        src={youTubeEmbedUrl(videoId, { autoplay })}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
