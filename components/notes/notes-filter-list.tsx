"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, CircleDot, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChipRow } from "@/components/ui/chip-row";
import { useCompletedChapters, useVisitedChapters } from "@/lib/progress";
import { MODULES, MODULE_COLOR_CLASSES } from "@/lib/modules";
import type { NoteMeta, Difficulty } from "@/lib/types";

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];

export function NotesFilterList({ notes }: { notes: NoteMeta[] }) {
  const [moduleFilter, setModuleFilter] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | null>(null);
  const [highYieldOnly, setHighYieldOnly] = useState(false);
  const { isComplete } = useCompletedChapters();
  const visited = useVisitedChapters();

  const filtered = useMemo(() => {
    return notes
      .filter((n) => !moduleFilter || n.module === moduleFilter)
      .filter((n) => !difficultyFilter || n.difficulty === difficultyFilter)
      .filter((n) => !highYieldOnly || n.interviewWeight >= 4)
      .sort((a, b) => a.order - b.order);
  }, [notes, moduleFilter, difficultyFilter, highYieldOnly]);

  return (
    <div>
      <ChipRow className="mb-6">
        <Button variant={moduleFilter === null ? "secondary" : "outline"} size="sm" onClick={() => setModuleFilter(null)}>
          All modules
        </Button>
        {MODULES.map((m) => (
          <Button
            key={m.slug}
            variant={moduleFilter === m.name ? "secondary" : "outline"}
            size="sm"
            onClick={() => setModuleFilter(moduleFilter === m.name ? null : m.name)}
          >
            {m.name}
          </Button>
        ))}
      </ChipRow>

      <ChipRow className="mb-3">
        {DIFFICULTIES.map((d) => (
          <Button
            key={d}
            variant={difficultyFilter === d ? "secondary" : "outline"}
            size="sm"
            onClick={() => setDifficultyFilter(difficultyFilter === d ? null : d)}
            className="capitalize"
          >
            {d}
          </Button>
        ))}
        <Button variant={highYieldOnly ? "secondary" : "outline"} size="sm" onClick={() => setHighYieldOnly((v) => !v)}>
          <Star className="h-3.5 w-3.5" /> High-yield only
        </Button>
      </ChipRow>
      <p className="mb-8 text-sm text-muted-foreground sm:text-right">{filtered.length} chapters</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((n) => {
          const mod = MODULES.find((m) => m.name === n.module)!;
          const colors = MODULE_COLOR_CLASSES[mod.color];
          const done = isComplete(n.slug);
          const started = !done && visited.includes(n.slug);
          return (
            <Link
              key={n.slug}
              href={`/notes/${n.slug}`}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex items-center justify-between">
                <span className={`rounded-full border px-2 py-0.5 text-[0.7rem] font-medium ${colors.badge}`}>
                  {mod.name}
                </span>
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : started ? (
                  <CircleDot className="h-4 w-4 text-amber-500" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/30" />
                )}
              </div>
              <h3 className="font-medium leading-snug">
                <span className="text-muted-foreground/60">{n.order}.</span> {n.title}
              </h3>
              <p className="line-clamp-2 text-xs text-muted-foreground">{n.summary}</p>
              <div className="mt-auto flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                <span>{n.duration}</span>
                <span className="capitalize">{n.difficulty}</span>
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: n.interviewWeight }).map((_, i) => (
                    <Star key={i} className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                  ))}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
