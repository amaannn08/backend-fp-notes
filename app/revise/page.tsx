import type { Metadata } from "next";
import { getAllProcessedNotes } from "@/lib/content";
import { MODULES, MODULE_COLOR_CLASSES } from "@/lib/modules";
import { PrintButton } from "@/components/study/print-button";

export const metadata: Metadata = {
  title: "Revise",
  description: "Every chapter's TL;DR and cheat sheet on one page — built for last-minute revision.",
};

export default async function RevisePage() {
  const notes = await getAllProcessedNotes();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-bold tracking-tight">Revise</h1>
          <p className="text-sm text-muted-foreground">TL;DR and cheat sheet for all {notes.length} chapters, in study order.</p>
        </div>
        <PrintButton />
      </div>

      <nav data-no-print className="mb-10 flex flex-wrap gap-2 rounded-lg border border-border bg-card p-3">
        {MODULES.map((m) => {
          const colors = MODULE_COLOR_CLASSES[m.color];
          return (
            <a key={m.slug} href={`#${m.slug}`} className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors.badge}`}>
              {m.name}
            </a>
          );
        })}
      </nav>

      {MODULES.map((mod) => {
        const chapters = notes.filter((n) => n.module === mod.name).sort((a, b) => a.order - b.order);
        if (chapters.length === 0) return null;
        return (
          <section key={mod.slug} id={mod.slug} className="mb-14 scroll-mt-20">
            <h2 className="mb-6 border-b border-border pb-2 text-lg font-semibold">{mod.name}</h2>
            {chapters.map((note) => (
              <div key={note.slug} id={note.slug} className="mb-10 scroll-mt-20 break-inside-avoid">
                <h3 className="mb-3 text-xl font-semibold">
                  <span className="mr-1.5 text-muted-foreground/60">{note.order}.</span>
                  {note.title}
                </h3>
                <ul className="mb-4 flex flex-col gap-1.5">
                  {note.tldr.map((line, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-6">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {line}
                    </li>
                  ))}
                </ul>
                <div className="note-prose prose prose-zinc dark:prose-invert max-w-none text-sm">{note.cheatSheet}</div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
