"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, List, PanelLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollDirection } from "@/lib/use-scroll-direction";
import { useActiveHeading } from "@/lib/use-active-heading";
import { useCompletedChapters } from "@/lib/progress";
import { CHAPTERS_OPEN_EVENT } from "@/lib/search-events";
import { TocSheet } from "@/components/notes/toc-sheet";
import type { HeadingItem, NoteNav } from "@/lib/types";

export function ReaderBar({
  slug,
  prev,
  next,
  headings,
}: {
  slug: string;
  prev: NoteNav | null;
  next: NoteNav | null;
  headings: HeadingItem[];
}) {
  const direction = useScrollDirection();
  const activeId = useActiveHeading(headings);
  const activeHeading = headings.find((h) => h.id === activeId);
  const { isComplete, toggle } = useCompletedChapters();
  const [tocOpen, setTocOpen] = useState(false);
  const complete = isComplete(slug);

  return (
    <>
      <div
        data-reader-bar
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md transition-transform duration-200 xl:hidden ${
          direction === "down" ? "translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="mx-auto flex h-14 max-w-screen-md items-center gap-1 px-2">
          <Button
            variant="ghost"
            size="icon"
            asChild={!!prev}
            disabled={!prev}
            aria-label="Previous chapter"
            className="shrink-0"
          >
            {prev ? (
              <Link href={`/notes/${prev.slug}`}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>

          <button
            type="button"
            onClick={() => setTocOpen(true)}
            disabled={headings.length === 0}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left text-sm disabled:opacity-40"
          >
            <List className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate font-medium">{activeHeading?.text ?? "Contents"}</span>
          </button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Open chapters"
            className="shrink-0"
            onClick={() => window.dispatchEvent(new CustomEvent(CHAPTERS_OPEN_EVENT))}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label={complete ? "Mark chapter incomplete" : "Mark chapter complete"}
            aria-pressed={complete}
            className={`shrink-0 ${complete ? "text-emerald-500" : ""}`}
            onClick={() => toggle(slug)}
          >
            <Check className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            asChild={!!next}
            disabled={!next}
            aria-label="Next chapter"
            className="shrink-0"
          >
            {next ? (
              <Link href={`/notes/${next.slug}`}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <TocSheet open={tocOpen} onOpenChange={setTocOpen} headings={headings} activeId={activeId} />
    </>
  );
}
