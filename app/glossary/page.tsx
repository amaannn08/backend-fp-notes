import type { Metadata } from "next";
import { getGroupedGlossary } from "@/lib/content";
import { GlossaryBrowser } from "@/components/study/glossary-browser";

export const metadata: Metadata = {
  title: "Glossary",
  description: "Every backend term defined across the course, A to Z.",
};

export default async function GlossaryPage() {
  const grouped = await getGroupedGlossary();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Glossary</h1>
      <p className="mb-6 text-sm text-muted-foreground">{grouped.length} unique terms, defined across all chapters.</p>
      <GlossaryBrowser entries={grouped} />
    </div>
  );
}
