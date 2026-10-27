"use client";

import { useActiveHeading } from "@/lib/use-active-heading";
import type { HeadingItem } from "@/lib/types";

export function Toc({ headings }: { headings: HeadingItem[] }) {
  const activeId = useActiveHeading(headings);

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
