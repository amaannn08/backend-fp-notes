"use client";

import { useEffect, useRef } from "react";
import { recordLastVisited } from "@/lib/progress";

export function TrackVisit({ slug, title }: { slug: string; title: string }) {
  const frame = useRef<number | null>(null);

  useEffect(() => {
    recordLastVisited({ slug, title, scrollPct: 0, ts: Date.now() });

    function onScroll() {
      if (frame.current) return;
      frame.current = window.requestAnimationFrame(() => {
        frame.current = null;
        const scrollTop = document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const pct = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
        recordLastVisited({ slug, title, scrollPct: pct, ts: Date.now() });
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current) window.cancelAnimationFrame(frame.current);
    };
  }, [slug, title]);

  return null;
}
