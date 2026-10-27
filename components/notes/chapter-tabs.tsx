"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/notes/question-card";
import type { QuestionItem } from "@/lib/types";

const TAB_VALUES = ["notes", "revise", "qa"] as const;
type TabValue = (typeof TAB_VALUES)[number];

export function ChapterTabs({
  body,
  tldr,
  cheatSheet,
  questions,
}: {
  body: ReactNode;
  tldr: string[];
  cheatSheet: ReactNode;
  questions: QuestionItem[];
}) {
  const [tab, setTab] = useState<TabValue>("notes");
  const [showAll, setShowAll] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (TAB_VALUES.includes(hash as TabValue)) setTab(hash as TabValue);
  }, []);

  function handleTabChange(value: string) {
    setTab(value as TabValue);
    window.history.replaceState(null, "", `#${value}`);
  }

  function toggleShowAll() {
    setShowAll((s) => !s);
    setResetKey((k) => k + 1);
  }

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="mt-6">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="notes" className="flex-1 sm:flex-none">
          Notes
        </TabsTrigger>
        <TabsTrigger value="revise" className="flex-1 sm:flex-none">
          Quick revise
        </TabsTrigger>
        <TabsTrigger value="qa" className="flex-1 sm:flex-none">
          Q&amp;A
        </TabsTrigger>
      </TabsList>

      <TabsContent value="notes">
        <article id="chapter-article" className="note-prose prose prose-zinc dark:prose-invert max-w-none">
          {body}
        </article>
      </TabsContent>

      <TabsContent value="revise">
        <div className="not-prose">
          <h2 className="mb-3 text-lg font-semibold">TL;DR</h2>
          <ul className="mb-8 flex flex-col gap-2">
            {tldr.map((line, i) => (
              <li key={i} className="flex gap-2 text-sm leading-6">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {line}
              </li>
            ))}
          </ul>
          <h2 className="mb-3 text-lg font-semibold">Cheat sheet</h2>
          <div className="note-prose prose prose-zinc dark:prose-invert max-w-none text-sm">{cheatSheet}</div>
        </div>
      </TabsContent>

      <TabsContent value="qa">
        <div className="not-prose">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{questions.length} questions</p>
            <Button variant="outline" size="sm" onClick={toggleShowAll}>
              {showAll ? "Collapse all" : "Show all answers"}
            </Button>
          </div>
          {questions.map((q) => (
            <QuestionCard key={`${q.id}-${resetKey}`} id={q.id} question={q.question} answer={q.answer} defaultOpen={showAll} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
