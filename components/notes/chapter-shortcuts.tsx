"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCompletedChapters } from "@/lib/progress";
import { SEARCH_OPEN_EVENT } from "@/lib/search-events";
import type { HeadingItem } from "@/lib/types";

export function ChapterShortcuts({
  slug,
  prevSlug,
  nextSlug,
  headings,
}: {
  slug: string;
  prevSlug?: string;
  nextSlug?: string;
  headings: HeadingItem[];
}) {
  const router = useRouter();
  const { toggle } = useCompletedChapters();

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case "m":
          toggle(slug);
          break;
        case "n":
          if (nextSlug) router.push(`/notes/${nextSlug}`);
          break;
        case "p":
          if (prevSlug) router.push(`/notes/${prevSlug}`);
          break;
        case "/":
          e.preventDefault();
          window.dispatchEvent(new CustomEvent(SEARCH_OPEN_EVENT));
          break;
        case "j":
        case "k": {
          const positions = headings
            .map((h) => document.getElementById(h.id))
            .filter((el): el is HTMLElement => !!el)
            .map((el) => el.getBoundingClientRect().top);
          if (positions.length === 0) break;
          if (e.key === "j") {
            const nextTop = positions.find((top) => top > 80);
            if (nextTop !== undefined) window.scrollBy({ top: nextTop - 72, behavior: "smooth" });
          } else {
            const prevTops = positions.filter((top) => top < -10);
            const prevTop = prevTops.at(-1);
            if (prevTop !== undefined) window.scrollBy({ top: prevTop - 72, behavior: "smooth" });
          }
          break;
        }
      }
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [slug, prevSlug, nextSlug, headings, toggle, router]);

  return null;
}
