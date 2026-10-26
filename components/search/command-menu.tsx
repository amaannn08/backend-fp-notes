"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BookOpen,
  Brain,
  FileText,
  Hash,
  Layers,
  Library,
  Moon,
  Printer,
  Sun,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { SEARCH_OPEN_EVENT } from "@/lib/search-events";
import type { SearchDoc } from "@/lib/types";

const TYPE_LABEL: Record<SearchDoc["type"], string> = {
  chapter: "Chapters",
  section: "Sections",
  question: "Interview questions",
  glossary: "Glossary",
};

const TYPE_ICON: Record<SearchDoc["type"], typeof FileText> = {
  chapter: BookOpen,
  section: Hash,
  question: Brain,
  glossary: Library,
};

export function CommandMenu() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(SearchDoc & { score: number })[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [miniSearch, setMiniSearch] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        setOpen(true);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeydown);
    window.addEventListener(SEARCH_OPEN_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeydown);
      window.removeEventListener(SEARCH_OPEN_EVENT, onOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (!open || miniSearch || loading) return;
    setLoading(true);
    (async () => {
      const [{ default: MiniSearch }, res] = await Promise.all([
        import("minisearch"),
        fetch("/search-index.json"),
      ]);
      const docs: SearchDoc[] = await res.json();
      const index = new MiniSearch<SearchDoc>({
        fields: ["title", "text"],
        storeFields: ["type", "title", "text", "chapterSlug", "chapterTitle", "anchor", "module"],
        idField: "id",
        searchOptions: { fuzzy: 0.2, prefix: true, boost: { title: 3 } },
      });
      index.addAll(docs);
      setMiniSearch(index);
      setLoading(false);
    })();
  }, [open, miniSearch, loading]);

  useEffect(() => {
    if (!miniSearch) return;
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const hits = miniSearch.search(query).slice(0, 24);
    setResults(hits);
  }, [query, miniSearch]);

  const grouped = useMemo(() => {
    const groups: Record<string, (SearchDoc & { score: number })[]> = {};
    for (const r of results) {
      groups[r.type] = groups[r.type] ?? [];
      groups[r.type].push(r);
    }
    return groups;
  }, [results]);

  function go(href: string) {
    close();
    router.push(href);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search"
      description="Search chapters, sections, interview questions and glossary terms"
    >
      <CommandInput placeholder="Search chapters, questions, glossary..." value={query} onValueChange={setQuery} />
      <CommandList>
        {query.trim() && results.length === 0 && (
          <CommandEmpty>{loading ? "Loading index…" : "No results found."}</CommandEmpty>
        )}

        {!query.trim() && (
          <>
            <CommandGroup heading="Study tools">
              <CommandItem onSelect={() => go("/notes")}>
                <BookOpen className="h-4 w-4" /> All chapters
              </CommandItem>
              <CommandItem onSelect={() => go("/interview")}>
                <Brain className="h-4 w-4" /> Interview bank
              </CommandItem>
              <CommandItem onSelect={() => go("/flashcards")}>
                <Layers className="h-4 w-4" /> Flashcards
              </CommandItem>
              <CommandItem onSelect={() => go("/print")}>
                <Printer className="h-4 w-4" /> Print / PDF
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Preferences">
              <CommandItem onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
                {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                Toggle theme
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {(["chapter", "section", "question", "glossary"] as const).map((type) =>
          grouped[type]?.length ? (
            <CommandGroup heading={TYPE_LABEL[type]} key={type}>
              {grouped[type].map((r) => {
                const Icon = TYPE_ICON[type];
                const href = r.anchor ? `/notes/${r.chapterSlug}#${r.anchor}` : `/notes/${r.chapterSlug}`;
                return (
                  <CommandItem key={r.id} value={r.id} onSelect={() => go(href)}>
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">{r.title}</span>
                      {type !== "chapter" && (
                        <span className="truncate text-xs text-muted-foreground">{r.chapterTitle}</span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ) : null
        )}
      </CommandList>
    </CommandDialog>
  );
}
