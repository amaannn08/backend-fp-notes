import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { toString as hastToString } from "hast-util-to-string";
import type { Root as HastRoot, Element as HastElement, RootContent } from "hast";
import type { ReactNode } from "react";

import remarkAlerts, { type AlertType } from "@/lib/remark-alerts";
import rehypeMermaidPlugin from "@/lib/rehype-mermaid";
import rehypeTagQuestions from "@/lib/rehype-tag-questions";

import { Callout } from "@/components/notes/callout";
import { Mermaid } from "@/components/notes/mermaid";
import { QnA } from "@/components/notes/qna";
import { CodeBlockFigure, TableScroll } from "@/components/notes/code-block";
import { H2, H3, H4 } from "@/components/notes/heading";
import { Anchor } from "@/components/notes/anchor";

import type { HeadingItem, SectionText, TimestampItem } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = Record<string, any>;

const components = {
  blockquote(props: Props) {
    const alertType = props["data-alert"] as AlertType | undefined;
    if (alertType) {
      return <Callout type={alertType}>{props.children}</Callout>;
    }
    return <blockquote>{props.children}</blockquote>;
  },
  figure(props: Props) {
    if (props["data-rehype-pretty-code-figure"] !== undefined) {
      return <CodeBlockFigure>{props.children}</CodeBlockFigure>;
    }
    return <figure>{props.children}</figure>;
  },
  div(props: Props) {
    if (props["data-mermaid"] !== undefined) {
      const chart = typeof props.children === "string" ? props.children : String(props.children ?? "");
      return <Mermaid>{chart}</Mermaid>;
    }
    return <div {...props} />;
  },
  details(props: Props) {
    return <QnA data-qid={props["data-qid"]}>{props.children}</QnA>;
  },
  table(props: Props) {
    return <TableScroll>{props.children}</TableScroll>;
  },
  h2(props: Props) {
    return <H2 id={props.id}>{props.children}</H2>;
  },
  h3(props: Props) {
    return <H3 id={props.id}>{props.children}</H3>;
  },
  h4(props: Props) {
    return <H4 id={props.id}>{props.children}</H4>;
  },
  a(props: Props) {
    return <Anchor {...props} />;
  },
};

function buildProcessor(slug: string) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkAlerts)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeTagQuestions(slug))
    .use(rehypeMermaidPlugin)
    .use(rehypePrettyCode, {
      theme: { dark: "github-dark", light: "github-light" },
      keepBackground: false,
      defaultLang: "text",
    });
}

function renderHastNodes(nodes: RootContent[]): ReactNode {
  const root: HastRoot = { type: "root", children: nodes };
  return toJsxRuntime(root, { Fragment, jsx, jsxs, components });
}

function isElement(node: RootContent): node is HastElement {
  return node.type === "element";
}

/** Returns the elements between an h2 whose text matches `headingText` and the next h2. */
function findSection(topLevel: HastElement[], headingText: string): HastElement[] | null {
  const idx = topLevel.findIndex(
    (n) => n.tagName === "h2" && hastToString(n).trim().toLowerCase() === headingText.toLowerCase()
  );
  if (idx === -1) return null;
  const content: HastElement[] = [];
  for (let i = idx + 1; i < topLevel.length; i++) {
    if (topLevel[i].tagName === "h2") break;
    content.push(topLevel[i]);
  }
  return content;
}

function firstList(nodes: HastElement[]): HastElement | undefined {
  return nodes.find((n) => n.tagName === "ul" || n.tagName === "ol");
}

export interface ExtractedQuestion {
  id: string;
  question: string;
  answer: ReactNode;
  answerText: string;
}

export interface ExtractedGlossaryTerm {
  term: string;
  definition: string;
  slug: string;
}

export interface ProcessedNoteContent {
  headings: HeadingItem[];
  tldr: string[];
  body: ReactNode;
  cheatSheet: ReactNode;
  cheatSheetText: string;
  questions: ExtractedQuestion[];
  glossary: ExtractedGlossaryTerm[];
  timestamps: TimestampItem[];
  sections: SectionText[];
  diagramCount: number;
}

function slugifyTerm(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function processNoteMarkdown(markdown: string, slug: string): Promise<ProcessedNoteContent> {
  const processor = buildProcessor(slug);
  const mdastTree = processor.parse(markdown);
  const hastTree = (await processor.run(mdastTree)) as HastRoot;
  const topLevel = hastTree.children.filter(isElement);

  const headings: HeadingItem[] = [];
  for (const el of topLevel) {
    if (el.tagName === "h2" || el.tagName === "h3") {
      const id = (el.properties?.id as string) ?? "";
      const text = hastToString(el);
      if (id) headings.push({ id, text, depth: el.tagName === "h2" ? 2 : 3 });
    }
  }

  // TL;DR
  const tldr: string[] = [];
  const tldrSection = findSection(topLevel, "TL;DR");
  if (tldrSection) {
    const list = firstList(tldrSection);
    if (list) {
      for (const li of list.children) {
        if (isElement(li) && li.tagName === "li") tldr.push(hastToString(li).trim());
      }
    }
  }

  // Glossary
  const glossary: ExtractedGlossaryTerm[] = [];
  const glossarySection = findSection(topLevel, "Glossary");
  if (glossarySection) {
    const list = firstList(glossarySection);
    if (list) {
      for (const li of list.children) {
        if (!isElement(li) || li.tagName !== "li") continue;
        const full = hastToString(li).trim();
        const m = /^(.+?)\s+[—–-]\s+([\s\S]+)$/.exec(full);
        if (!m) continue;
        const term = m[1].trim();
        glossary.push({ term, definition: m[2].trim(), slug: slugifyTerm(term) });
      }
    }
  }

  // Video timestamps
  const timestamps: TimestampItem[] = [];
  const tsSection = findSection(topLevel, "Video timestamps");
  if (tsSection) {
    const list = firstList(tsSection);
    if (list) {
      for (const li of list.children) {
        if (!isElement(li) || li.tagName !== "li") continue;
        const linkEl = li.children.find((c) => isElement(c) && c.tagName === "a") as HastElement | undefined;
        if (!linkEl) continue;
        const href = (linkEl.properties?.href as string) ?? "";
        const secMatch = /[?&]t=(\d+)s/.exec(href);
        if (!secMatch) continue;
        const seconds = Number(secMatch[1]);
        const display = hastToString(linkEl).trim();
        const fullText = hastToString(li);
        const afterLink = fullText
          .slice(fullText.indexOf(display) + display.length)
          .replace(/^\s*[—–-]\s*/, "")
          .trim();
        timestamps.push({ label: afterLink || display, seconds, display });
      }
    }
  }

  // Cheat sheet
  const cheatSheetSection = findSection(topLevel, "Cheat sheet") ?? [];
  const cheatSheet = renderHastNodes(cheatSheetSection);
  const cheatSheetText = cheatSheetSection.map((n) => hastToString(n)).join(" ");

  // Interview questions
  const questions: ExtractedQuestion[] = [];
  const qSection = findSection(topLevel, "Interview questions") ?? [];
  for (const el of qSection) {
    if (el.tagName !== "details") continue;
    const qid = (el.properties?.["data-qid"] as string) ?? "";
    const summaryEl = el.children.find((c) => isElement(c) && c.tagName === "summary") as HastElement | undefined;
    const questionText = summaryEl ? hastToString(summaryEl).replace(/^Q:\s*/, "").trim() : "";
    const answerNodes = el.children.filter((c) => c !== summaryEl && isElement(c)) as HastElement[];
    questions.push({
      id: qid,
      question: questionText,
      answer: renderHastNodes(answerNodes),
      answerText: answerNodes.map((n) => hastToString(n)).join(" "),
    });
  }

  // Generic sections (for search) — every h2 and its content, stopping at the next h2
  const sections: SectionText[] = [];
  for (const el of topLevel) {
    if (el.tagName !== "h2") continue;
    const id = (el.properties?.id as string) ?? "";
    const heading = hastToString(el);
    const content = findSection(topLevel, heading) ?? [];
    const text = content.map((n) => hastToString(n)).join(" ");
    sections.push({ id, heading, text });
  }

  const diagramCount = (markdown.match(/^```mermaid\s*$/gm) ?? []).length;
  const body = renderHastNodes(hastTree.children);

  return {
    headings,
    tldr,
    body,
    cheatSheet,
    cheatSheetText,
    questions,
    glossary,
    timestamps,
    sections,
    diagramCount,
  };
}
