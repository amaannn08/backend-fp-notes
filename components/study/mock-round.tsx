"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { X, ThumbsDown, ThumbsUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLeitnerBoxes } from "@/lib/progress";

export interface MockQuestion {
  id: string;
  question: string;
  answer: ReactNode;
  chapterSlug: string;
  chapterTitle: string;
}

export function MockRound({ questions, onClose }: { questions: MockQuestion[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const { grade } = useLeitnerBoxes();
  const current = questions[index];
  const progress = useMemo(() => Math.round(((index + (revealed ? 0.5 : 0)) / questions.length) * 100), [index, revealed, questions.length]);

  if (!current) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/98 p-6 text-center backdrop-blur-sm">
        <Zap className="h-10 w-10 text-primary" />
        <h2 className="text-xl font-semibold">Round complete</h2>
        <p className="text-muted-foreground">You went through {questions.length} questions.</p>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }

  function next(result: "again" | "good" | "easy") {
    grade(current.id, result);
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/98 backdrop-blur-sm">
      <div className="flex items-center gap-3 border-b border-border p-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {index + 1}/{questions.length}
        </span>
        <Button variant="ghost" size="icon" className="size-8" onClick={onClose} aria-label="Close mock round">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-4 py-10">
        <Link href={`/notes/${current.chapterSlug}`} className="text-xs text-muted-foreground hover:text-primary">
          {current.chapterTitle}
        </Link>
        <p className="text-center text-xl font-medium leading-relaxed">{current.question}</p>

        {!revealed ? (
          <Button size="lg" onClick={() => setRevealed(true)}>
            Reveal answer
          </Button>
        ) : (
          <>
            <div className="w-full rounded-xl border border-border bg-card p-5 text-sm leading-7">{current.answer}</div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => next("again")} className="gap-2">
                <ThumbsDown className="h-4 w-4 text-rose-500" /> Again
              </Button>
              <Button variant="outline" onClick={() => next("good")} className="gap-2">
                <ThumbsUp className="h-4 w-4 text-amber-500" /> Good
              </Button>
              <Button variant="outline" onClick={() => next("easy")} className="gap-2">
                <Zap className="h-4 w-4 text-emerald-500" /> Easy
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
