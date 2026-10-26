import type { Metadata } from "next";
import { getAllNotesMeta } from "@/lib/content";
import { buildRoadmapMermaid } from "@/lib/roadmap";
import { RoadmapDiagram } from "@/components/study/roadmap-diagram";
import { MODULES } from "@/lib/modules";
import { ChapterNavList, type ChapterNavGroup } from "@/components/layout/chapter-nav-list";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "Visual dependency graph of every chapter — what builds on what.",
};

export default function RoadmapPage() {
  const notes = getAllNotesMeta();
  const source = buildRoadmapMermaid(notes);
  const groups: ChapterNavGroup[] = MODULES.map((mod) => ({
    name: mod.name,
    color: mod.color,
    chapters: notes
      .filter((n) => n.module === mod.name)
      .sort((a, b) => a.order - b.order)
      .map((n) => ({ slug: n.slug, title: n.title, order: n.order })),
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Roadmap</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Chapters that depend on each other, grouped by module. Click any node to open that chapter — chapters you&apos;ve
        completed are highlighted.
      </p>
      <RoadmapDiagram source={source} notes={notes} />

      <div className="mt-10 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Plain list (for small screens or if the diagram fails to load)</h2>
        <ChapterNavList groups={groups} />
      </div>
    </div>
  );
}
