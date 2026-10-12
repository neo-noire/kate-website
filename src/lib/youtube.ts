const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * The video id from a YouTube link (watch, share, embed, shorts or live) or a bare id.
 * Returns null for anything else.
 */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (VIDEO_ID.test(value)) return value;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id: string | null | undefined;
  if (host === "youtu.be") id = url.pathname.split("/")[1];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const [, first, second] = url.pathname.split("/");
    id = first === "watch" ? url.searchParams.get("v") : ["embed", "shorts", "live", "v"].includes(first) ? second : null;
  }
  return id && VIDEO_ID.test(id) ? id : null;
}

export function youTubeWatchUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}

/** Privacy-enhanced embed: no YouTube cookies until the video plays. */
export function youTubeEmbedUrl(id: string) {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
}
