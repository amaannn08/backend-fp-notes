"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface GlossaryEntry {
  term: string;
  definition: string;
  chapters: { slug: string; title: string }[];
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("");

function letterFor(term: string): string {
  const first = term[0]?.toUpperCase() ?? "#";
  return /[A-Z]/.test(first) ? first : "#";
}

export function GlossaryBrowser({ entries }: { entries: GlossaryEntry[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.term.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q));
  }, [entries, query]);

  // Only the first entry of each letter gets the jump-target id — every entry sharing a letter
  // would otherwise produce duplicate, invalid HTML ids.
  const rows = useMemo(() => {
    return filtered.reduce<{ entry: GlossaryEntry; anchorId?: string }[]>((acc, e) => {
      const letter = letterFor(e.term);
      const prevLetter = acc.length > 0 ? letterFor(acc[acc.length - 1].entry.term) : "";
      const anchorId = letter === prevLetter ? undefined : `glossary-${letter}`;
      acc.push({ entry: e, anchorId });
      return acc;
    }, []);
  }, [filtered]);

  const availableLetters = useMemo(() => {
    const set = new Set<string>();
    for (const e of filtered) set.add(letterFor(e.term));
    return set;
  }, [filtered]);

  function jumpTo(letter: string) {
    document.getElementById(`glossary-${letter}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 bg-background/95 px-4 py-2 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="relative mb-3 sm:mb-4">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search terms..." className="pl-8" />
        </div>

        <div className="scrollbar-hide -mx-4 flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-2 px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-2">
          {LETTERS.map((l) => (
            <button
              key={l}
              onClick={() => jumpTo(l)}
              disabled={!availableLetters.has(l)}
              className="flex size-9 shrink-0 items-center justify-center rounded-md text-xs font-medium text-muted-foreground transition-colors enabled:hover:bg-secondary enabled:hover:text-foreground disabled:opacity-30 pointer-coarse:size-10"
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-4 mt-4 text-sm text-muted-foreground sm:mt-0">{filtered.length} terms</p>

      <div className="flex flex-col divide-y divide-border">
        {rows.map(({ entry: e, anchorId }) => (
          <div
            key={e.term}
            id={anchorId}
            className="scroll-mt-36 py-4 [content-visibility:auto] [contain-intrinsic-size:auto_7rem]"
          >
            <h3 className="font-semibold">{e.term}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{e.definition}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {e.chapters.map((c) => (
                <Link
                  key={c.slug}
                  href={`/notes/${c.slug}#glossary`}
                  className="rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground hover:bg-secondary/80 pointer-coarse:py-1.5"
                >
                  {c.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
