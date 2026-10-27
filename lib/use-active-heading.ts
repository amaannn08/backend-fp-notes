"use client";

import { useEffect, useState } from "react";
import type { HeadingItem } from "@/lib/types";

/** Tracks which heading is currently in view, for TOC highlighting and the mobile reader bar's section label. */
export function useActiveHeading(headings: HeadingItem[]): string {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const elements = headings.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => !!el);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  return activeId;
}
