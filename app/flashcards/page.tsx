import type { Metadata } from "next";
import { getAllQuestions, getAllGlossaryTerms, getAllNotesMeta } from "@/lib/content";
import { FlashcardDeck, type FlashcardItem } from "@/components/study/flashcard-deck";

export const metadata: Metadata = {
  title: "Flashcards",
  description: "Spaced-repetition flashcard drill built from every interview question and glossary term.",
};

export default async function FlashcardsPage() {
  const [questions, glossary, notes] = await Promise.all([
    getAllQuestions(),
    getAllGlossaryTerms(),
    Promise.resolve(getAllNotesMeta()),
  ]);
  const moduleBySlug = Object.fromEntries(notes.map((n) => [n.slug, n.module]));

  const cards: FlashcardItem[] = [
    ...questions.map((q): FlashcardItem => ({
      id: q.id,
      front: q.question,
      back: q.answer,
      module: q.module,
      kind: "question",
      chapterSlug: q.chapterSlug,
      chapterTitle: q.chapterTitle,
    })),
    ...glossary.map((g): FlashcardItem => ({
      id: `glossary:${g.chapterSlug}:${g.slug}`,
      front: g.term,
      back: g.definition,
      module: moduleBySlug[g.chapterSlug] ?? "Orientation",
      kind: "glossary",
      chapterSlug: g.chapterSlug,
      chapterTitle: g.chapterTitle,
    })),
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Flashcards</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {cards.length} cards across questions and glossary terms. Space to flip, grade to schedule the next review.
      </p>
      <FlashcardDeck cards={cards} />
    </div>
  );
}
