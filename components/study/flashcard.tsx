"use client";

import { useEffect, useState, type ReactNode } from "react";
import { RotateCw } from "lucide-react";

export function Flashcard({ front, back, cardKey }: { front: ReactNode; back: ReactNode; cardKey: string }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => setFlipped(false), [cardKey]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      className="relative flex min-h-[min(60dvh,26rem)] w-full flex-col items-center justify-center rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-shadow hover:shadow-md sm:p-8"
    >
      <span className="absolute right-4 top-4 flex items-center gap-1 text-xs text-muted-foreground">
        <RotateCw className="h-3 w-3" />
        <span className="pointer-coarse:hidden">space to flip</span>
        <span className="hidden pointer-coarse:inline">tap to flip</span>
      </span>
      {!flipped ? (
        <p className="text-xl font-medium leading-relaxed">{front}</p>
      ) : (
        <div className="max-h-[50dvh] w-full overflow-y-auto overscroll-contain text-left text-sm leading-7">{back}</div>
      )}
    </button>
  );
}
