import { Clock, Star, Tag } from "lucide-react";
import { MODULE_COLOR_CLASSES, getModule } from "@/lib/modules";
import type { Difficulty, ModuleName } from "@/lib/types";

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function NoteHeader({
  title,
  module: moduleName,
  difficulty,
  duration,
  readingTime,
  interviewWeight,
  tags,
  summary,
  order,
}: {
  title: string;
  module: ModuleName;
  difficulty: Difficulty;
  duration: string;
  readingTime: number;
  interviewWeight: number;
  tags: string[];
  summary: string;
  order: number;
}) {
  const mod = getModule(moduleName);
  const colors = MODULE_COLOR_CLASSES[mod.color];

  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full border px-2.5 py-0.5 font-medium ${colors.badge}`}>{mod.name}</span>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-muted-foreground">
          {DIFFICULTY_LABEL[difficulty]}
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" /> {duration} video · {readingTime} min read
        </span>
        <span className="flex items-center gap-0.5" title={`Interview weight ${interviewWeight}/5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${i < interviewWeight ? "fill-amber-500 text-amber-500" : "text-border"}`}
            />
          ))}
        </span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        <span className="mr-2 text-muted-foreground/60">{order}.</span>
        {title}
      </h1>
      <p className="max-w-2xl text-base text-muted-foreground">{summary}</p>

      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag className="h-3 w-3 text-muted-foreground" />
          {tags.map((t) => (
            <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
              {t}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
