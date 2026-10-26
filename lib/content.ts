import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";
import { frontmatterSchema, type Frontmatter } from "@/lib/schema";
import { processNoteMarkdown } from "@/lib/markdown";
import type { NoteMeta, NoteNav, ProcessedNote, QuestionItem, GlossaryTerm, SearchDoc } from "@/lib/types";

const CONTENT_DIR = path.join(process.cwd(), "content", "notes");

interface RawNote {
  file: string;
  frontmatter: Frontmatter;
  content: string;
}

function wordCount(markdown: string): number {
  return markdown.split(/\s+/).filter(Boolean).length;
}

function readRawNotes(): RawNote[] {
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  const notes = files.map((file) => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
    const { data, content } = matter(raw);
    const parsed = frontmatterSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(`Invalid frontmatter in ${file}:\n${parsed.error.message}`);
    }
    if (parsed.data.slug !== file.replace(/^\d+-/, "").replace(/\.md$/, "")) {
      throw new Error(`Slug mismatch in ${file}: frontmatter slug is "${parsed.data.slug}"`);
    }
    return { file, frontmatter: parsed.data, content };
  });
  return notes.sort((a, b) => a.frontmatter.order - b.frontmatter.order);
}

export const getAllRawNotes = cache((): RawNote[] => readRawNotes());

export const getAllNotesMeta = cache((): NoteMeta[] => {
  const raw = getAllRawNotes();
  return raw.map((r, i): NoteMeta => {
    const prevRaw = raw[i - 1];
    const nextRaw = raw[i + 1];
    const wc = wordCount(r.content);
    const prev: NoteNav | null = prevRaw
      ? { slug: prevRaw.frontmatter.slug, title: prevRaw.frontmatter.title, order: prevRaw.frontmatter.order }
      : null;
    const next: NoteNav | null = nextRaw
      ? { slug: nextRaw.frontmatter.slug, title: nextRaw.frontmatter.title, order: nextRaw.frontmatter.order }
      : null;
    return {
      ...r.frontmatter,
      readingTime: Math.max(1, Math.round(wc / 220)),
      wordCount: wc,
      diagramCount: (r.content.match(/^```mermaid\s*$/gm) ?? []).length,
      questionCount: (r.content.match(/<details>/g) ?? []).length,
      prev,
      next,
    };
  });
});

export function getAllSlugs(): string[] {
  return getAllRawNotes().map((r) => r.frontmatter.slug);
}

export function getNoteMeta(slug: string): NoteMeta | undefined {
  return getAllNotesMeta().find((n) => n.slug === slug);
}

export const getProcessedNote = cache(async (slug: string): Promise<ProcessedNote> => {
  const raw = getAllRawNotes().find((r) => r.frontmatter.slug === slug);
  if (!raw) throw new Error(`Note not found: ${slug}`);
  const meta = getNoteMeta(slug);
  if (!meta) throw new Error(`Meta not found: ${slug}`);

  const processed = await processNoteMarkdown(raw.content, slug);
  const chapterTitle = raw.frontmatter.title;

  const questions: QuestionItem[] = processed.questions.map((q) => ({
    id: q.id,
    question: q.question,
    answer: q.answer,
    answerText: q.answerText,
    chapterSlug: slug,
    chapterTitle,
    chapterOrder: meta.order,
    module: meta.module,
  }));

  const glossary: GlossaryTerm[] = processed.glossary.map((g) => ({
    ...g,
    chapterSlug: slug,
    chapterTitle,
  }));

  return {
    ...meta,
    headings: processed.headings,
    tldr: processed.tldr,
    body: processed.body,
    cheatSheet: processed.cheatSheet,
    questions,
    glossary,
    timestamps: processed.timestamps,
    sections: processed.sections,
  };
});

export const getAllProcessedNotes = cache(async (): Promise<ProcessedNote[]> => {
  const slugs = getAllSlugs();
  return Promise.all(slugs.map((s) => getProcessedNote(s)));
});

export const getAllQuestions = cache(async (): Promise<QuestionItem[]> => {
  const notes = await getAllProcessedNotes();
  return notes.flatMap((n) => n.questions);
});

export const getAllGlossaryTerms = cache(async (): Promise<GlossaryTerm[]> => {
  const notes = await getAllProcessedNotes();
  return notes.flatMap((n) => n.glossary);
});

/** Same term defined in multiple chapters, grouped for the /glossary page. */
export const getGroupedGlossary = cache(async (): Promise<
  { term: string; definition: string; slug: string; chapters: { slug: string; title: string }[] }[]
> => {
  const terms = await getAllGlossaryTerms();
  const byKey = new Map<string, { term: string; definition: string; slug: string; chapters: { slug: string; title: string }[] }>();
  for (const t of terms) {
    const key = t.term.toLowerCase();
    const existing = byKey.get(key);
    if (existing) {
      if (!existing.chapters.some((c) => c.slug === t.chapterSlug)) {
        existing.chapters.push({ slug: t.chapterSlug, title: t.chapterTitle });
      }
    } else {
      byKey.set(key, { term: t.term, definition: t.definition, slug: t.slug, chapters: [{ slug: t.chapterSlug, title: t.chapterTitle }] });
    }
  }
  return [...byKey.values()].sort((a, b) => a.term.localeCompare(b.term));
});

export const getStats = cache(async () => {
  const notes = await getAllProcessedNotes();
  const glossary = await getGroupedGlossary();
  return {
    chapterCount: notes.length,
    totalWords: notes.reduce((sum, n) => sum + n.wordCount, 0),
    totalDiagrams: notes.reduce((sum, n) => sum + n.diagramCount, 0),
    totalQuestions: notes.reduce((sum, n) => sum + n.questions.length, 0),
    totalGlossaryTerms: glossary.length,
  };
});

export const getSearchDocs = cache(async (): Promise<SearchDoc[]> => {
  const notes = await getAllProcessedNotes();
  const docs: SearchDoc[] = [];
  for (const n of notes) {
    docs.push({
      id: `chapter:${n.slug}`,
      type: "chapter",
      title: n.title,
      text: `${n.summary} ${n.tags.join(" ")}`,
      chapterSlug: n.slug,
      chapterTitle: n.title,
      module: n.module,
    });
    for (const s of n.sections) {
      if (!s.text.trim()) continue;
      docs.push({
        id: `section:${n.slug}:${s.id}`,
        type: "section",
        title: s.heading,
        text: s.text,
        chapterSlug: n.slug,
        chapterTitle: n.title,
        anchor: s.id,
        module: n.module,
      });
    }
    for (const q of n.questions) {
      docs.push({
        id: `question:${q.id}`,
        type: "question",
        title: q.question,
        text: q.answerText,
        chapterSlug: n.slug,
        chapterTitle: n.title,
        anchor: "interview-questions",
        module: n.module,
      });
    }
    for (const g of n.glossary) {
      docs.push({
        id: `glossary:${n.slug}:${g.slug}`,
        type: "glossary",
        title: g.term,
        text: g.definition,
        chapterSlug: n.slug,
        chapterTitle: n.title,
        anchor: "glossary",
        module: n.module,
      });
    }
  }
  return docs;
});
