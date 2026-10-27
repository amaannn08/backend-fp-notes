"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import { useCompletedChapters, useVisitedChapters } from "@/lib/progress";
import { MODULE_COLOR_CLASSES } from "@/lib/modules";
import type { ModuleDef } from "@/lib/modules";

export interface ChapterNavGroup {
  name: string;
  color: ModuleDef["color"];
  chapters: { slug: string; title: string; order: number }[];
}

export function ChapterNavList({ groups, onNavigate }: { groups: ChapterNavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { isComplete } = useCompletedChapters();
  const visited = useVisitedChapters();

  return (
    <nav className="flex flex-col gap-5">
      {groups.map((group) => {
        const colors = MODULE_COLOR_CLASSES[group.color];
        return (
          <div key={group.name}>
            <div className="mb-1.5 flex items-center gap-2 px-2">
              <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
              <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{group.name}</h4>
            </div>
            <ul className="flex flex-col gap-0.5">
              {group.chapters.map((c) => {
                const active = pathname === `/notes/${c.slug}`;
                const done = isComplete(c.slug);
                const started = !done && visited.includes(c.slug);
                return (
                  <li key={c.slug}>
                    <Link
                      href={`/notes/${c.slug}`}
                      onClick={onNavigate}
                      data-active={active || undefined}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors pointer-coarse:py-2.5 ${
                        active ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      ) : started ? (
                        <CircleDot className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />
                      )}
                      <span className="w-5 shrink-0 text-xs tabular-nums opacity-60">{c.order}</span>
                      <span className="min-w-0 flex-1 truncate pointer-coarse:line-clamp-2 pointer-coarse:whitespace-normal">
                        {c.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
