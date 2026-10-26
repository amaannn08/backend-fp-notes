"use client";

import { useEffect, useState } from "react";
import type { HeadingItem } from "@/lib/types";

export function Toc({ headings }: { headings: HeadingItem[] }) {
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

  if (headings.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="flex flex-col gap-0.5 text-sm">
      <p className="mb-2 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">On this page</p>
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          className={`truncate rounded-md px-2 py-1 transition-colors ${
            h.depth === 3 ? "ml-3 text-[0.8rem]" : ""
          } ${
            activeId === h.id
              ? "bg-secondary font-medium text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {h.text}
        </a>
      ))}
    </nav>
  );
}
