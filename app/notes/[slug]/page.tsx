import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getAllSlugs, getNoteMeta, getProcessedNote } from "@/lib/content";
import { getModule } from "@/lib/modules";
import { NoteHeader } from "@/components/notes/note-header";
import { PrereqChips } from "@/components/notes/prereq-chips";
import { VideoEmbed } from "@/components/notes/video-embed";
import { ChapterTabs } from "@/components/notes/chapter-tabs";
import { MarkComplete } from "@/components/notes/mark-complete";
import { PrevNext } from "@/components/notes/prev-next";
import { Toc } from "@/components/notes/toc";
import { ReaderBar } from "@/components/notes/reader-bar";
import { ReadingProgressBar } from "@/components/notes/reading-progress-bar";
import { TrackVisit } from "@/components/notes/track-visit";
import { ChapterShortcuts } from "@/components/notes/chapter-shortcuts";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = getNoteMeta(slug);
  if (!meta) return {};
  return {
    title: meta.title,
    description: meta.summary,
    openGraph: { title: meta.title, description: meta.summary },
  };
}

export default async function ChapterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = getNoteMeta(slug);
  if (!meta) notFound();

  const note = await getProcessedNote(slug);
  const mod = getModule(note.module);
  const prereqMetas = note.prerequisites
    .map((p) => getNoteMeta(p))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({ slug: p.slug, title: p.title }));

  return (
    <>
      <ReadingProgressBar />
      <TrackVisit slug={note.slug} title={note.title} />
      <ChapterShortcuts
        slug={note.slug}
        prevSlug={note.prev?.slug}
        nextSlug={note.next?.slug}
        headings={note.headings}
      />
      <ReaderBar slug={note.slug} prev={note.prev} next={note.next} headings={note.headings} />

      <div className="mx-auto flex max-w-screen-xl gap-10 px-4 py-8 sm:px-6 xl:gap-12">
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/notes" className="-my-2 py-2 hover:text-foreground">
              Chapters
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>{mod.name}</span>
            <ChevronRight className="hidden h-3.5 w-3.5 sm:block" />
            <span className="hidden truncate text-foreground sm:inline">{note.title}</span>
          </nav>

          <NoteHeader
            title={note.title}
            module={note.module}
            difficulty={note.difficulty}
            duration={note.duration}
            readingTime={note.readingTime}
            interviewWeight={note.interviewWeight}
            tags={note.tags}
            summary={note.summary}
            order={note.order}
          />

          <div className="mt-4">
            <PrereqChips prereqs={prereqMetas} />
          </div>

          <VideoEmbed videoId={note.videoId} title={note.title} />

          <ChapterTabs body={note.body} tldr={note.tldr} cheatSheet={note.cheatSheet} questions={note.questions} />

          <div className="mt-10 flex flex-col gap-6 border-t border-border pt-8">
            <div className="flex justify-end">
              <MarkComplete slug={note.slug} />
            </div>
            <PrevNext prev={note.prev} next={note.next} />
          </div>
        </div>

        <aside className="sticky top-20 hidden h-fit w-56 shrink-0 xl:block">
          <Toc headings={note.headings} />
        </aside>
      </div>
    </>
  );
}
