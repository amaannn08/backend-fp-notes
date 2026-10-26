import type { Metadata } from "next";
import { getAllProcessedNotes, getStats } from "@/lib/content";
import { getModule } from "@/lib/modules";
import { PrintProviders } from "@/components/study/print-providers";

export const metadata: Metadata = {
  title: "Print / PDF",
  description: "The entire book — all 31 chapters — on one printable page. Save as PDF from your browser's print dialog.",
};

export default async function PrintPage() {
  const notes = await getAllProcessedNotes();
  const stats = await getStats();

  return (
    <PrintProviders totalDiagrams={stats.totalDiagrams}>
      <div id="print-book" className="mx-auto max-w-3xl px-4 py-8 sm:px-6 print:max-w-none print:px-0">
        <section className="flex min-h-[70vh] flex-col items-center justify-center text-center print:break-after-page">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Fan-made study notes
          </p>
          <h1 className="max-w-xl text-4xl font-bold tracking-tight">Backend from First Principles</h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Complete notes for the playlist by Sriniously — {stats.chapterCount} chapters, {stats.totalDiagrams}{" "}
            diagrams, {stats.totalQuestions} interview questions.
          </p>
          <p className="mt-8 text-xs text-muted-foreground">
            Generated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </section>

        <section className="mb-12 print:break-after-page">
          <h2 className="mb-4 text-xl font-semibold">Table of contents</h2>
          <ol className="flex flex-col divide-y divide-border">
            {notes.map((n) => (
              <li key={n.slug} className="flex items-baseline gap-3 py-1.5 text-sm">
                <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">{n.order}.</span>
                <span className="flex-1">{n.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{getModule(n.module).name}</span>
              </li>
            ))}
          </ol>
        </section>

        {notes.map((note) => (
          <article
            key={note.slug}
            className="note-prose prose prose-zinc dark:prose-invert mb-16 max-w-none print:mb-0 print:break-before-page"
          >
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {getModule(note.module).name}
            </p>
            <h1 className="mb-2">
              {note.order}. {note.title}
            </h1>
            <p className="text-muted-foreground">{note.summary}</p>
            {note.body}
          </article>
        ))}
      </div>
    </PrintProviders>
  );
}
