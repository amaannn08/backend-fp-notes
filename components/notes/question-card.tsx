"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { useKnownQuestions } from "@/lib/progress";

export function QuestionCard({
  id,
  question,
  answer,
  chapterLink,
  defaultOpen = false,
}: {
  id: string;
  question: ReactNode;
  answer: ReactNode;
  chapterLink?: { slug: string; title: string };
  defaultOpen?: boolean;
}) {
  const { isKnown, toggle } = useKnownQuestions();
  const known = isKnown(id);

  return (
    <details
      data-qid={id}
      open={defaultOpen || undefined}
      className="not-prose group my-3 rounded-lg border border-border bg-card open:bg-card/60"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[0.95rem] font-medium marker:content-none [&::-webkit-details-marker]:hidden">
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
        <span className="min-w-0 flex-1">{question}</span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle(id);
          }}
          aria-pressed={known}
          aria-label={known ? "Marked as known" : "Mark as known"}
          className={`shrink-0 rounded-full p-1 transition-colors ${
            known ? "text-emerald-500" : "text-muted-foreground/50 hover:text-muted-foreground"
          }`}
        >
          {known ? <CheckCircle2 className="h-4.5 w-4.5" /> : <Circle className="h-4.5 w-4.5" />}
        </button>
      </summary>
      <div className="border-t border-border px-4 py-3 text-[0.925rem] leading-7 [&>:first-child]:mt-0 [&>:last-child]:mb-0">
        {answer}
        {chapterLink && (
          <p className="mt-3 text-xs">
            <Link href={`/notes/${chapterLink.slug}`} className="text-primary hover:underline">
              From &ldquo;{chapterLink.title}&rdquo; →
            </Link>
          </p>
        )}
      </div>
    </details>
  );
}
