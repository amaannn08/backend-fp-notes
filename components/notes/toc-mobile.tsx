"use client";

import { useState } from "react";
import { ChevronDown, List } from "lucide-react";
import type { HeadingItem } from "@/lib/types";

export function TocMobile({ headings }: { headings: HeadingItem[] }) {
  const [open, setOpen] = useState(false);
  if (headings.length === 0) return null;

  return (
    <div className="relative mb-4 xl:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-muted-foreground">
          <List className="h-4 w-4" /> On this page
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-card p-2 shadow-lg">
          {headings.map((h) => (
            <a
              key={h.id}
              href={`#${h.id}`}
              onClick={() => setOpen(false)}
              className={`block truncate rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground ${
                h.depth === 3 ? "ml-3 text-xs" : ""
              }`}
            >
              {h.text}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
