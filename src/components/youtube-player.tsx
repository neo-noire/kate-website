import { youTubeEmbedUrl } from "@/lib/youtube";

/** A 16:9 YouTube embed. */
export function YouTubePlayer({ videoId, title }: { videoId: string; title: string }) {
  return (
    <div className="videoFrame">
      <iframe
        src={youTubeEmbedUrl(videoId)}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
