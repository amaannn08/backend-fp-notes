import type { Metadata } from "next";
import { getAllNotesMeta } from "@/lib/content";
import { NotesFilterList } from "@/components/notes/notes-filter-list";

export const metadata: Metadata = {
  title: "All chapters",
  description: "Browse all 31 chapters, filter by module, difficulty, or interview weight.",
};

export default function NotesIndexPage() {
  const notes = getAllNotesMeta();
  return (
    <div className="px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">All chapters</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        31 chapters, filterable by module, difficulty, and interview relevance.
      </p>
      <NotesFilterList notes={notes} />
    </div>
  );
}
