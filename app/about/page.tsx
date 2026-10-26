import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getStats } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description: "Credits and disclaimer for this fan-made study companion.",
};

export default async function AboutPage() {
  const stats = await getStats();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">About this site</h1>

      <div className="prose prose-zinc dark:prose-invert max-w-none text-sm leading-7">
        <p>
          This is a fan-made, unofficial study companion for{" "}
          <a href="https://www.youtube.com/playlist?list=PLui3EUkuMTPgZcV0QhQrOcwMPcBCcd_Q1" target="_blank" rel="noopener noreferrer">
            <strong>Backend from First Principles</strong>
          </a>
          , a free YouTube playlist by{" "}
          <a href="https://www.youtube.com/@sriniously" target="_blank" rel="noopener noreferrer">
            <strong>Sriniously</strong>
          </a>
          . All of the underlying ideas, structure, and teaching belong to that series — this site exists only to
          turn {stats.chapterCount} hours of video into notes you can read, search, and drill before a placement
          interview.
        </p>

        <h2>What&apos;s here</h2>
        <ul>
          <li>{stats.chapterCount} chapters of notes, one per video, following the original order</li>
          <li>{stats.totalDiagrams} diagrams redrawn as interactive Mermaid charts</li>
          <li>{stats.totalQuestions} interview questions with full answers</li>
          <li>{stats.totalGlossaryTerms} glossary terms, flashcards, a revision mode, and a printable PDF view</li>
        </ul>

        <h2>How it was made</h2>
        <p>
          Transcripts were pulled from the official videos and rewritten into structured notes — correcting
          transcription errors and filling in standard facts the videos don&apos;t have time to cover — then
          rendered into this site. Nothing here is a verbatim transcript; treat the notes as a study aid
          alongside the videos, not a replacement guaranteed to be error-free.
        </p>

        <h2>Support the original creator</h2>
        <p>
          If these notes help you, the best thing you can do is watch, like, and subscribe to{" "}
          <a href="https://www.youtube.com/@sriniously" target="_blank" rel="noopener noreferrer">
            Sriniously&apos;s channel
          </a>{" "}
          — this site is not affiliated with or endorsed by them.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="https://www.youtube.com/@sriniously"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary/60"
        >
          Sriniously on YouTube <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <Link
          href="https://www.youtube.com/playlist?list=PLui3EUkuMTPgZcV0QhQrOcwMPcBCcd_Q1"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary/60"
        >
          Original playlist <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
