"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CheckCircle2, Circle, CircleDot, Star } from "lucide-react";
import { useCompletedChapters, useVisitedChapters } from "@/lib/progress";
import { MODULE_COLOR_CLASSES, type ModuleDef } from "@/lib/modules";
import type { Difficulty } from "@/lib/types";

export interface ModuleChapter {
  slug: string;
  title: string;
  order: number;
  duration: string;
  difficulty: Difficulty;
  interviewWeight: number;
}

const DIFFICULTY_DOT: Record<Difficulty, string> = {
  beginner: "bg-emerald-500",
  intermediate: "bg-amber-500",
  advanced: "bg-rose-500",
};

export function ModuleCard({
  name,
  description,
  color,
  icon,
  chapters,
}: {
  name: string;
  description: string;
  color: ModuleDef["color"];
  icon: ReactNode;
  chapters: ModuleChapter[];
}) {
  const { isComplete } = useCompletedChapters();
  const visited = useVisitedChapters();
  const colors = MODULE_COLOR_CLASSES[color];

  const doneCount = chapters.filter((c) => isComplete(c.slug)).length;
  const pct = chapters.length > 0 ? Math.round((doneCount / chapters.length) * 100) : 0;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
          <div className={`h-full rounded-full ${colors.dot}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {doneCount}/{chapters.length}
        </span>
      </div>

      <ul className="mt-4 flex flex-col gap-0.5">
        {chapters.map((c) => {
          const done = isComplete(c.slug);
          const started = !done && visited.includes(c.slug);
          return (
            <li key={c.slug}>
              <Link
                href={`/notes/${c.slug}`}
                className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-secondary/60"
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : started ? (
                  <CircleDot className="h-4 w-4 shrink-0 text-amber-500" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                )}
                <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">{c.order}</span>
                <span className="min-w-0 flex-1 truncate group-hover:text-foreground">{c.title}</span>
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DIFFICULTY_DOT[c.difficulty]}`} />
                {c.interviewWeight >= 4 && (
                  <span className="flex shrink-0 items-center gap-0.5 text-amber-500">
                    <Star className="h-3 w-3 fill-current" />
                  </span>
                )}
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{c.duration}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
