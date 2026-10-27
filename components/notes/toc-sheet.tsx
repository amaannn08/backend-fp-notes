"use client";

import { useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { HeadingItem } from "@/lib/types";

export function TocSheet({
  open,
  onOpenChange,
  headings,
  activeId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headings: HeadingItem[];
  activeId: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: "center" });
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[75dvh] gap-2 rounded-t-2xl pr-0" showCloseButton={false}>
        <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted" />
        <SheetHeader className="pb-2">
          <SheetTitle>On this page</SheetTitle>
        </SheetHeader>
        <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <nav className="flex flex-col gap-0.5">
            {headings.map((h) => {
              const active = h.id === activeId;
              return (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  data-active={active || undefined}
                  onClick={() => onOpenChange(false)}
                  className={`flex min-h-11 items-center rounded-md border-l-2 px-3 py-2 text-sm leading-snug transition-colors ${
                    h.depth === 3 ? "ml-4 text-[0.85rem]" : ""
                  } ${
                    active
                      ? "border-primary bg-secondary font-medium text-foreground"
                      : "border-transparent text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  <span className="line-clamp-2">{h.text}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
