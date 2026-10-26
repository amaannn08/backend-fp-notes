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

export function GlossaryBrowser({ entries }: { entries: GlossaryEntry[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.term.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q));
  }, [entries, query]);

  const availableLetters = useMemo(() => {
    const set = new Set<string>();
    for (const e of filtered) {
      const first = e.term[0]?.toUpperCase() ?? "#";
      set.add(/[A-Z]/.test(first) ? first : "#");
    }
    return set;
  }, [filtered]);

  function jumpTo(letter: string) {
    document.getElementById(`glossary-${letter}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search terms..." className="pl-8" />
      </div>

      <div className="mb-8 flex flex-wrap gap-1 rounded-lg border border-border bg-card p-2">
        {LETTERS.map((l) => (
          <button
            key={l}
            onClick={() => jumpTo(l)}
            disabled={!availableLetters.has(l)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium text-muted-foreground transition-colors enabled:hover:bg-secondary enabled:hover:text-foreground disabled:opacity-30"
          >
            {l}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-muted-foreground">{filtered.length} terms</p>

      <div className="flex flex-col divide-y divide-border">
        {filtered.map((e) => {
          const letter = /[A-Z]/.test(e.term[0]?.toUpperCase() ?? "") ? e.term[0].toUpperCase() : "#";
          return (
            <div key={e.term} id={`glossary-${letter}`} className="scroll-mt-20 py-4">
              <h3 className="font-semibold">{e.term}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{e.definition}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {e.chapters.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/notes/${c.slug}#glossary`}
                    className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground hover:bg-secondary/80"
                  >
                    {c.title}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
