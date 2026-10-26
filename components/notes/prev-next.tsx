import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { NoteNav } from "@/lib/types";

export function PrevNext({ prev, next }: { prev: NoteNav | null; next: NoteNav | null }) {
  if (!prev && !next) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {prev ? (
        <Link
          href={`/notes/${prev.slug}`}
          className="group flex flex-col rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowLeft className="h-3 w-3" /> Previous
          </span>
          <span className="mt-1 font-medium group-hover:text-primary">{prev.title}</span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`/notes/${next.slug}`}
          className="group flex flex-col rounded-lg border border-border p-4 text-right transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
            Next <ArrowRight className="h-3 w-3" />
          </span>
          <span className="mt-1 font-medium group-hover:text-primary">{next.title}</span>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
