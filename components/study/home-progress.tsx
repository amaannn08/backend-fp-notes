"use client";

import { useCompletedChapters, useKnownQuestions } from "@/lib/progress";
import { ProgressRing } from "@/components/study/progress-ring";

export function HomeProgress({ totalChapters, totalQuestions }: { totalChapters: number; totalQuestions: number }) {
  const { completed } = useCompletedChapters();
  const { known } = useKnownQuestions();

  return (
    <div className="flex flex-wrap items-center gap-6 rounded-xl border border-border bg-card p-4">
      <ProgressRing value={completed.length} total={totalChapters} label="chapters complete" />
      <div className="h-10 w-px bg-border" />
      <ProgressRing value={known.length} total={totalQuestions} label="questions known" />
    </div>
  );
}
