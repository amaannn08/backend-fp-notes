"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { SEEK_EVENT, type SeekDetail } from "@/components/notes/video-embed";

const YT_TIMESTAMP_RE = /^https:\/\/www\.youtube\.com\/watch\?v=([\w-]+)&t=(\d+)s/;

export function Anchor(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { href = "", children, ...rest } = props;

  const tsMatch = YT_TIMESTAMP_RE.exec(href);
  if (tsMatch) {
    const [, videoId, secondsStr] = tsMatch;
    const seconds = Number(secondsStr);
    return (
      <a
        {...rest}
        href={href}
        onClick={(e) => {
          const embed = document.getElementById("video-embed");
          if (!embed) return; // no embed on this page (e.g. interview bank) — let it open in a new tab
          e.preventDefault();
          window.dispatchEvent(
            new CustomEvent<SeekDetail>(SEEK_EVENT, { detail: { videoId, seconds } })
          );
          embed.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-mono text-[0.9em] no-underline"
      >
        {children}
      </a>
    );
  }

  if (href.startsWith("/") || href.startsWith("#")) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  );
}
