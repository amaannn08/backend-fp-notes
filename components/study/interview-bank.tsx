"use client";

import { useMemo, useState } from "react";
import { Search, Shuffle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChipRow } from "@/components/ui/chip-row";
import { QuestionCard } from "@/components/notes/question-card";
import { MockRound, type MockQuestion } from "@/components/study/mock-round";
import { useKnownQuestions } from "@/lib/progress";
import { MODULES } from "@/lib/modules";
import type { QuestionItem } from "@/lib/types";

function weightedSample(questions: QuestionItem[], weights: Record<string, number>, n: number): QuestionItem[] {
  const pool: QuestionItem[] = [];
  for (const q of questions) {
    const w = Math.max(1, weights[q.chapterSlug] ?? 1);
    for (let i = 0; i < w; i++) pool.push(q);
  }
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const seen = new Set<string>();
  const result: QuestionItem[] = [];
  for (const q of shuffled) {
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    result.push(q);
    if (result.length >= n) break;
  }
  return result;
}

export function InterviewBank({
  questions,
  chapterWeights,
  chapters,
}: {
  questions: QuestionItem[];
  chapterWeights: Record<string, number>;
  chapters: { slug: string; title: string }[];
}) {
  const [moduleFilter, setModuleFilter] = useState<string | null>(null);
  const [chapterFilter, setChapterFilter] = useState<string | null>(null);
  const [hideKnown, setHideKnown] = useState(false);
  const [query, setQuery] = useState("");
  const [random, setRandom] = useState(false);
  const [mockQuestions, setMockQuestions] = useState<MockQuestion[] | null>(null);
  const { known, isKnown } = useKnownQuestions();

  const filtered = useMemo(() => {
    let list = questions
      .filter((q) => !moduleFilter || q.module === moduleFilter)
      .filter((q) => !chapterFilter || q.chapterSlug === chapterFilter)
      .filter((q) => !hideKnown || !isKnown(q.id))
      .filter((q) => !query.trim() || q.question.toLowerCase().includes(query.trim().toLowerCase()));
    list = [...list].sort((a, b) => a.chapterOrder - b.chapterOrder);
    if (random) list = [...list].sort(() => Math.random() - 0.5);
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, moduleFilter, chapterFilter, hideKnown, query, random, known]);

  function startMockRound() {
    const unknown = questions.filter((q) => !isKnown(q.id));
    const pool = unknown.length >= 5 ? unknown : questions;
    const picked = weightedSample(pool, chapterWeights, 10);
    setMockQuestions(
      picked.map((q) => ({ id: q.id, question: q.question, answer: q.answer, chapterSlug: q.chapterSlug, chapterTitle: q.chapterTitle }))
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:min-w-[200px] sm:flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter questions..."
            className="pl-8"
          />
        </div>
        <Button onClick={startMockRound} className="w-full gap-1.5 sm:w-auto">
          <Zap className="h-3.5 w-3.5" /> Mock round
        </Button>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
          <Button variant={random ? "secondary" : "outline"} size="sm" onClick={() => setRandom((r) => !r)} className="gap-1.5">
            <Shuffle className="h-3.5 w-3.5" /> {random ? "Random" : "By chapter"}
          </Button>
          <Button variant={hideKnown ? "secondary" : "outline"} size="sm" onClick={() => setHideKnown((h) => !h)}>
            Hide known
          </Button>
        </div>
        <Select value={chapterFilter ?? "all"} onValueChange={(v) => setChapterFilter(v === "all" ? null : v)}>
          <SelectTrigger size="sm" className="w-full sm:w-[180px]">
            <SelectValue placeholder="All chapters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All chapters</SelectItem>
            {chapters.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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

      <p className="mb-4 text-sm text-muted-foreground">
        {known.length} / {questions.length} known · {filtered.length} shown
      </p>

      <div>
        {filtered.map((q) => (
          <QuestionCard
            key={q.id}
            id={q.id}
            question={q.question}
            answer={q.answer}
            chapterLink={{ slug: q.chapterSlug, title: q.chapterTitle }}
          />
        ))}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No questions match these filters.</p>
        )}
      </div>

      {mockQuestions && <MockRound questions={mockQuestions} onClose={() => setMockQuestions(null)} />}
    </div>
  );
}
