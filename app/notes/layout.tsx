import { getAllNotesMeta } from "@/lib/content";
import { MODULES } from "@/lib/modules";
import { NotesShell } from "@/components/layout/notes-shell";
import type { ChapterNavGroup } from "@/components/layout/chapter-nav-list";

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  const notes = getAllNotesMeta();
  const groups: ChapterNavGroup[] = MODULES.map((mod) => ({
    name: mod.name,
    color: mod.color,
    chapters: notes
      .filter((n) => n.module === mod.name)
      .sort((a, b) => a.order - b.order)
      .map((n) => ({ slug: n.slug, title: n.title, order: n.order })),
  }));

  return <NotesShell groups={groups}>{children}</NotesShell>;
}
