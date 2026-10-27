"use client";

import { useCompletedChapters, useKnownQuestions } from "@/lib/progress";
import { ProgressRing } from "@/components/study/progress-ring";

export function HomeProgress({ totalChapters, totalQuestions }: { totalChapters: number; totalQuestions: number }) {
  const { completed } = useCompletedChapters();
  const { known } = useKnownQuestions();

  return (
    <div className="grid grid-cols-2 items-center gap-4 rounded-xl border border-border bg-card p-4 sm:flex sm:gap-6">
      <ProgressRing value={completed.length} total={totalChapters} label="chapters complete" />
      <div className="hidden h-10 w-px bg-border sm:block" />
      <ProgressRing value={known.length} total={totalQuestions} label="questions known" />
    </div>
  );
}
