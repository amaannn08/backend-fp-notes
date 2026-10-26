import type { Metadata } from "next";
import { getAllQuestions, getAllNotesMeta } from "@/lib/content";
import { InterviewBank } from "@/components/study/interview-bank";

export const metadata: Metadata = {
  title: "Interview question bank",
  description: "Every interview question from all 31 chapters in one searchable, filterable bank.",
};

export default async function InterviewPage() {
  const questions = await getAllQuestions();
  const notes = getAllNotesMeta();
  const chapters = [...notes].sort((a, b) => a.order - b.order).map((n) => ({ slug: n.slug, title: n.title }));
  const chapterWeights = Object.fromEntries(notes.map((n) => [n.slug, n.interviewWeight]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Interview question bank</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {questions.length} questions pulled from every chapter. Filter, search, or run a weighted mock round.
      </p>
      <InterviewBank questions={questions} chapterWeights={chapterWeights} chapters={chapters} />
    </div>
  );
}
