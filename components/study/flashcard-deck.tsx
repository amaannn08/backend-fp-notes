"use client";

import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ThumbsDown, ThumbsUp, Zap, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChipRow } from "@/components/ui/chip-row";
import { Flashcard } from "@/components/study/flashcard";
import { useKnownQuestions, useLeitnerBoxes } from "@/lib/progress";
import { MODULES } from "@/lib/modules";
import type { ModuleName } from "@/lib/types";

export interface FlashcardItem {
  id: string;
  front: ReactNode;
  back: ReactNode;
  module: ModuleName;
  kind: "question" | "glossary";
  chapterSlug: string;
  chapterTitle: string;
}

type DeckKey = "all" | "glossary" | "unknown" | ModuleName;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function FlashcardDeck({ cards }: { cards: FlashcardItem[] }) {
  const [deck, setDeck] = useState<DeckKey>("all");
  const [order, setOrder] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const { isKnown } = useKnownQuestions();
  const { grade, dueCount, isDue } = useLeitnerBoxes();
  const deckRef = useRef<HTMLDivElement>(null);

  const deckCards = useMemo(() => {
    let list = cards;
    if (deck === "glossary") list = list.filter((c) => c.kind === "glossary");
    else if (deck === "unknown") list = list.filter((c) => c.kind === "question" && !isKnown(c.id));
    else if (deck !== "all") list = list.filter((c) => c.module === deck);
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, deck, isKnown]);

  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  function startDeck(key: DeckKey) {
    setDeck(key);
    const pool =
      key === "glossary"
        ? cards.filter((c) => c.kind === "glossary")
        : key === "unknown"
          ? cards.filter((c) => c.kind === "question" && !isKnown(c.id))
          : key === "all"
            ? cards
            : cards.filter((c) => c.module === key);
    const due = pool.filter((c) => isDue(c.id));
    const chosen = due.length >= 3 ? due : pool;
    setOrder(shuffle(chosen).map((c) => c.id));
    setCursor(0);
    deckRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  const current = order[cursor] ? byId.get(order[cursor]) : undefined;

  function handleGrade(result: "again" | "good" | "easy") {
    if (current) grade(current.id, result);
    setCursor((c) => c + 1);
  }

  const deckChips: { key: DeckKey; label: string }[] = [
    { key: "all", label: "All" },
    ...MODULES.map((m) => ({ key: m.name as DeckKey, label: m.name })),
    { key: "glossary", label: "Glossary terms" },
    { key: "unknown", label: "Unknown only" },
  ];

  return (
    <div>
      <ChipRow className="mb-6">
        {deckChips.map((d) => {
          const count = d.key === "all" ? dueCount(cards.map((c) => c.id)) : dueCount(deckCards.map((c) => c.id));
          const total =
            d.key === "all"
              ? cards.length
              : d.key === "glossary"
                ? cards.filter((c) => c.kind === "glossary").length
                : d.key === "unknown"
                  ? cards.filter((c) => c.kind === "question" && !isKnown(c.id)).length
                  : cards.filter((c) => c.module === d.key).length;
          return (
            <Button key={d.key} variant={deck === d.key ? "secondary" : "outline"} size="sm" onClick={() => startDeck(d.key)} className="gap-1.5">
              {d.label}
              <span className="rounded-full bg-muted px-1.5 text-[0.7rem] text-muted-foreground">{total}</span>
              {count > 0 && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title={`${count} due`} />}
            </Button>
          );
        })}
      </ChipRow>

      <div ref={deckRef} className="scroll-mt-20">
        {order.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
            <Shuffle className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Pick a deck above to start drilling.</p>
          </div>
        ) : !current ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card py-16 text-center">
            <Zap className="h-8 w-8 text-primary" />
            <p className="font-medium">Deck complete — {order.length} cards reviewed.</p>
            <Button onClick={() => startDeck(deck)}>Restart deck</Button>
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-5">
            <p className="text-xs text-muted-foreground">
              Card {cursor + 1} / {order.length}
            </p>
            <Flashcard cardKey={current.id} front={current.front} back={current.back} />
            <Link href={`/notes/${current.chapterSlug}`} className="text-xs text-muted-foreground hover:text-primary">
              {current.chapterTitle}
            </Link>
            <div className="sticky bottom-0 -mx-4 grid w-[calc(100%+2rem)] grid-cols-3 gap-2 border-t border-border bg-background/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:w-auto sm:flex sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
              <Button variant="outline" onClick={() => handleGrade("again")} className="h-12 gap-2 sm:h-9">
                <ThumbsDown className="h-4 w-4 text-rose-500" /> Again
              </Button>
              <Button variant="outline" onClick={() => handleGrade("good")} className="h-12 gap-2 sm:h-9">
                <ThumbsUp className="h-4 w-4 text-amber-500" /> Good
              </Button>
              <Button variant="outline" onClick={() => handleGrade("easy")} className="h-12 gap-2 sm:h-9">
                <Zap className="h-4 w-4 text-emerald-500" /> Easy
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
