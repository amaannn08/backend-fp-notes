"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChapterNavList, type ChapterNavGroup } from "@/components/layout/chapter-nav-list";
import { CHAPTERS_OPEN_EVENT } from "@/lib/search-events";

export function NotesShell({ groups, children }: { groups: ChapterNavGroup[]; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener(CHAPTERS_OPEN_EVENT, onOpenEvent);
    return () => window.removeEventListener(CHAPTERS_OPEN_EVENT, onOpenEvent);
  }, []);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: "center" });
  }, [open]);

  return (
    <div className="mx-auto flex max-w-screen-2xl">
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 border-r border-border lg:block">
        <ScrollArea className="h-full px-3 py-6">
          <ChapterNavList groups={groups} />
        </ScrollArea>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-sm">
          <SheetHeader>
            <SheetTitle>Chapters</SheetTitle>
          </SheetHeader>
          <div ref={listRef}>
            <ScrollArea className="h-[calc(100dvh-5rem)] px-2">
              <ChapterNavList groups={groups} onNavigate={() => setOpen(false)} />
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
