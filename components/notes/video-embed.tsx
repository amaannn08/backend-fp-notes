"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

export interface SeekDetail {
  videoId: string;
  seconds: number;
}

export const SEEK_EVENT = "bfp:seek-video";

export function VideoEmbed({ videoId, title }: { videoId: string; title: string }) {
  const [loaded, setLoaded] = useState(false);
  const [startAt, setStartAt] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onSeek(e: Event) {
      const detail = (e as CustomEvent<SeekDetail>).detail;
      if (!detail || detail.videoId !== videoId) return;
      if (!loaded) {
        setStartAt(detail.seconds);
        setLoaded(true);
        return;
      }
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "seekTo", args: [detail.seconds, true] }),
        "*"
      );
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "playVideo", args: [] }),
        "*"
      );
    }
    window.addEventListener(SEEK_EVENT, onSeek);
    return () => window.removeEventListener(SEEK_EVENT, onSeek);
  }, [videoId, loaded]);

  return (
    <div
      id="video-embed"
      className="relative my-6 aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted"
    >
      {loaded ? (
        <iframe
          ref={iframeRef}
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&start=${startAt}&autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="group absolute inset-0 flex h-full w-full items-center justify-center"
          aria-label={`Play video: ${title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-60"
          />
          <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg transition-transform group-hover:scale-110">
            <Play className="h-7 w-7 fill-current" />
          </span>
        </button>
      )}
    </div>
  );
}
