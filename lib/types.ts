import type { ReactNode } from "react";

export type ModuleName =
  | "Orientation"
  | "Foundations"
  | "Core Building Blocks"
  | "API Design"
  | "Data Layer"
  | "Async & Real-time"
  | "Reliability & Operations"
  | "Security"
  | "Performance & Scale";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface NoteFrontmatter {
  title: string;
  slug: string;
  order: number;
  videoId: string;
  duration: string;
  module: ModuleName;
  difficulty: Difficulty;
  summary: string;
  tags: string[];
  prerequisites: string[];
  interviewWeight: number;
}

export interface HeadingItem {
  id: string;
  text: string;
  depth: 2 | 3;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  slug: string;
  chapterSlug: string;
  chapterTitle: string;
}

export interface QuestionItem {
  id: string;
  question: string;
  answer: ReactNode;
  answerText: string;
  chapterSlug: string;
  chapterTitle: string;
  chapterOrder: number;
  module: ModuleName;
}

export interface TimestampItem {
  label: string;
  seconds: number;
  display: string;
}

export interface NoteNav {
  slug: string;
  title: string;
  order: number;
}

export interface NoteMeta extends NoteFrontmatter {
  readingTime: number;
  wordCount: number;
  diagramCount: number;
  questionCount: number;
  prev: NoteNav | null;
  next: NoteNav | null;
}

export interface SectionText {
  id: string;
  heading: string;
  text: string;
}

export interface ProcessedNote extends NoteMeta {
  headings: HeadingItem[];
  tldr: string[];
  body: ReactNode;
  cheatSheet: ReactNode;
  questions: QuestionItem[];
  glossary: GlossaryTerm[];
  timestamps: TimestampItem[];
  sections: SectionText[];
}

export interface SearchDoc {
  id: string;
  type: "chapter" | "section" | "question" | "glossary";
  title: string;
  text: string;
  chapterSlug: string;
  chapterTitle: string;
  anchor?: string;
  module: ModuleName;
}
