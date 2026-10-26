"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useCompletedChapters } from "@/lib/progress";

export function PrereqChips({ prereqs }: { prereqs: { slug: string; title: string }[] }) {
  const { isComplete } = useCompletedChapters();
  if (prereqs.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">Builds on:</span>
      {prereqs.map((p) => {
        const done = isComplete(p.slug);
        return (
          <Link
            key={p.slug}
            href={`/notes/${p.slug}`}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
              done
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {done && <CheckCircle2 className="h-3 w-3" />}
            {p.title}
          </Link>
        );
      })}
    </div>
  );
}
