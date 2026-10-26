"use client";

import { useState, type ReactNode } from "react";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChapterNavList, type ChapterNavGroup } from "@/components/layout/chapter-nav-list";

export function NotesShell({ groups, children }: { groups: ChapterNavGroup[]; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto flex max-w-screen-2xl">
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 border-r border-border lg:block">
        <ScrollArea className="h-full px-3 py-6">
          <ChapterNavList groups={groups} />
        </ScrollArea>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="border-b border-border px-4 py-2 lg:hidden">
          <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
            <PanelLeft className="h-3.5 w-3.5" />
            All chapters
          </Button>
        </div>
        {children}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle>Chapters</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-5rem)] px-2">
            <ChapterNavList groups={groups} onNavigate={() => setOpen(false)} />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
