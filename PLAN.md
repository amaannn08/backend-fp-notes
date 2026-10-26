# BackendFP — Implementation Plan

> **For the implementing agent (Sonnet):** This file is the complete spec. Build the site in THIS directory
> (`~/Projects/backend-fp-notes`), which already contains the content. Do not touch `../Learn Vault`.
> Work phase by phase, run `npm run build` at the end of every phase, and fix all errors before moving on.
> Do not rewrite the note content except to fix rendering bugs (e.g. broken Mermaid syntax).

---

## 0. What we are building

A fast, static, beautiful **study website** for the 31-video YouTube playlist
*"Backend from First Principles"* by Sriniously, built for one goal: **preparing for backend placement
interviews**. Every video has a detailed chapter of notes with diagrams, code, callouts, interview Q&A,
a cheat sheet and a glossary. On top of the chapters the site adds study tools: progress tracking,
an aggregated interview question bank, flashcards, a revision (cheat-sheet) mode, full-text search, and a
printable "whole book" page so it can be saved as a PDF.

No backend, no database, no auth. Everything is generated at build time; user state lives in `localStorage`.
Deployed to Vercel.

### What already exists in this directory
```
backend-fp-notes/
├── NOTES_SPEC.md            # exact format of every note (READ THIS — the parser depends on it)
├── PLAN.md                  # this file
├── content/notes/NN-slug.md # 31 chapter files (markdown + YAML frontmatter)
├── data/playlist.json       # [{pos, id, title}] for all 31 videos
├── data/transcripts/*.json  # raw transcripts  — NEVER import into the app, not for deployment
├── data/txt/*.txt           # plain transcripts — NEVER import into the app
└── scripts/*.py             # fetch scripts (not part of the site)
```

### Content status (already verified)
31/31 notes written · ~228k words · **305 Mermaid diagrams (all pass `mermaid.parse`)** · 392 interview Q&As ·
935 glossary terms. All `prerequisites` slugs resolve. Video 05's timestamps were rescaled to the real video length.

`scripts/mermaid-check.mjs` (`node scripts/mermaid-check.mjs content/notes/*.md`) is a working parse checker, but it
imports mermaid/dompurify from `../Learn Vault/node_modules` by absolute path — when building §7, port it to use
this project's own `mermaid` + `dompurify` deps (same trick: stub `addHook/removeHook/removeHooks/sanitize` on
DOMPurify before importing `mermaid/dist/mermaid.core.mjs`; no jsdom needed).

Long chapters: several notes are 10k–17k words. The chapter page must stay fast — lazy-render Mermaid
(already specified) and do not ship the whole book's content to the client on any page except `/print`.

### Note format recap (see NOTES_SPEC.md for full detail)
- YAML frontmatter: `title, slug, order, videoId, duration, module, difficulty, summary, tags[],
  prerequisites[] (slugs), interviewWeight (1–5)`.
- Body: GFM markdown with fixed `##` sections: `TL;DR`, `Why this matters`, concept sections…,
  `Common mistakes & misconceptions`, `Interview questions`, `Cheat sheet`, `Glossary`, `Video timestamps`.
- ` ```mermaid ` code blocks for diagrams.
- GitHub-style alerts `> [!NOTE] | [!TIP] | [!WARNING] | [!IMPORTANT] | [!INTERVIEW]` (INTERVIEW is custom).
- Interview Q&A as raw HTML `<details><summary><strong>Q: …</strong></summary> …markdown… </details>`.
- Glossary lines: `- **Term** — definition`.
- Timestamps: `- [MM:SS](https://www.youtube.com/watch?v=ID&t=123s) — label`.

---

## 1. Tech stack (use exactly this unless something is broken)

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript**, fully static (`generateStaticParams`, no server code) | Native on Vercel |
| Styling | **Tailwind CSS v4** + `@tailwindcss/typography` | Fast, prose styles for notes |
| UI primitives | **shadcn/ui** (Dialog, Command, Tabs, Tooltip, Progress, Sheet, Badge, Button, ScrollArea) | Accessible, consistent |
| Icons | `lucide-react` | |
| Theme | `next-themes` (light/dark/system, default **dark**) | |
| Markdown | **unified**: `remark-parse` → `remark-gfm` → `remark-frontmatter` + `gray-matter` → custom `remarkAlerts` → `remark-rehype {allowDangerousHtml:true}` → `rehype-raw` → `rehype-slug` → `rehype-autolink-headings` → `rehype-pretty-code` (Shiki, themes `github-dark` / `github-light`) → `rehype-react`/`hast-util-to-jsx-runtime` | Full control, all at build time |
| Diagrams | `mermaid` (client-side, dynamic import, theme-aware) | rehype-mermaid needs Playwright — not available on Vercel build |
| Search | `minisearch`, index generated at build time | Tiny, offline, fuzzy |
| Validation | `zod` for frontmatter | Fail build on bad content |
| Animations | `motion` (framer-motion) — subtle only | |
| Fonts | `next/font`: **Inter** (UI), **JetBrains Mono** (code) | |
| Analytics | `@vercel/analytics` | free |

Package manager: `npm`. Node 20+.

---

## 2. Information architecture & routes

```
/                         Landing + course map (modules → chapters), overall progress ring, "continue where you left off"
/notes                    All chapters list (filter by module / difficulty / interviewWeight, sort by order)
/notes/[slug]             Chapter page (the core of the site)
/interview                Interview question bank: every Q&A from every chapter, filterable, "random 10" mode
/flashcards               Flashcard drill (built from interview Qs + glossary terms), Leitner boxes in localStorage
/revise                   Revision mode: TL;DR + Cheat sheet of every chapter, one long page, module jump links
/glossary                 A–Z of every glossary term across chapters, each linking back to its chapter
/roadmap                  Visual dependency graph of chapters (from `prerequisites`) — rendered with Mermaid flowchart
/print                    The entire book (all chapters in order, cover + TOC) with print CSS → "Save as PDF"
/about                    Credits: Sriniously's channel + playlist links, disclaimer that these are fan-made notes
```

Modules (from NOTES_SPEC.md) in this order, each with an icon + accent color:
1. Orientation (01–04) · 2. Foundations (05–07) · 3. Core Building Blocks (08–10) · 4. API Design (11, 29, 30) ·
5. Data Layer (12, 13, 15, 24, 25) · 6. Async & Real-time (14, 26) · 7. Reliability & Operations
(16, 17, 18, 19, 27, 28, 31) · 8. Security (20) · 9. Performance & Scale (21, 22, 23)

> Module ordering is a *suggested study path*, chapter numbers stay the video numbers. Put the module →
> chapter mapping in `lib/modules.ts` (single source of truth: name, slug, icon, color, description,
> order) and **derive** chapter membership from each note's `module` frontmatter.

---

## 3. Project structure to create

```
app/
  layout.tsx                 # fonts, ThemeProvider, <Header/>, <CommandMenu/>, Analytics
  page.tsx                   # landing / course map
  notes/page.tsx
  notes/[slug]/page.tsx      # generateStaticParams + generateMetadata
  interview/page.tsx
  flashcards/page.tsx
  revise/page.tsx
  glossary/page.tsx
  roadmap/page.tsx
  print/page.tsx
  about/page.tsx
  sitemap.ts  robots.ts  opengraph-image.tsx (+ notes/[slug]/opengraph-image.tsx)
  not-found.tsx
components/
  layout/ Header.tsx  Sidebar.tsx (chapter nav grouped by module, progress checkmarks)  MobileNav.tsx (Sheet)
          Footer.tsx  ThemeToggle.tsx
  notes/  NoteHeader.tsx (title, module badge, difficulty, duration, interviewWeight stars, read-time, tags)
          NoteBody.tsx (renders compiled hast → React with component overrides below)
          Toc.tsx (right rail, scroll-spy with IntersectionObserver)
          Mermaid.tsx  Callout.tsx  CodeBlock.tsx (copy button, filename/lang label)
          QnA.tsx (styled <details>, "mark as known" toggle)  VideoEmbed.tsx (lite YouTube facade)
          Timestamps.tsx (clicking seeks the embedded player instead of leaving the site)
          PrevNext.tsx  MarkComplete.tsx  PrereqChips.tsx  ReadingProgressBar.tsx
  study/  QuestionBank.tsx  Flashcard.tsx  FlashcardDeck.tsx  ProgressRing.tsx  ContinueCard.tsx
  search/ CommandMenu.tsx (⌘K / Ctrl+K / "/")
lib/
  content.ts      # load + validate + cache all notes (fs, gray-matter, zod) — server-only
  markdown.ts     # unified pipeline → hast; extract sections, headings, Q&As, glossary, cheat sheet, timestamps
  remark-alerts.ts# custom plugin for > [!TYPE] incl. INTERVIEW
  modules.ts
  search-index.ts # builds MiniSearch docs (one doc per `##`/`###` section + each Q&A + each glossary term)
  progress.ts     # localStorage hooks: useProgress, useKnownQuestions, useFlashcardBoxes, useLastVisited
  schema.ts       # zod schema for frontmatter
scripts/
  lint-content.ts # frontmatter + section + mermaid validation (see §7)
  build-search.ts # writes public/search-index.json at prebuild
```

---

## 4. Content pipeline (`lib/content.ts`, `lib/markdown.ts`)

1. Read `content/notes/*.md` (only that glob — never `data/`). Parse with `gray-matter`, validate with zod;
   on failure throw with the filename (build must fail loudly).
2. Sort by `order`. Compute `readingTime` (words / 220), `wordCount`, `prev`/`next`.
3. Parse markdown into mdast once, then extract structured data **by walking the tree** (not regex on raw text):
   - `headings`: all `##`/`###` with slug ids → TOC.
   - `tldr`: list under `## TL;DR`.
   - `cheatSheet`: mdast subtree under `## Cheat sheet` (rendered on /revise).
   - `glossary`: list items under `## Glossary` matching `**Term** — def` → `{term, definition, slug}`.
   - `questions`: every `<details>` html node pair under `## Interview questions` → `{id, question, answerHtml,
     chapterSlug}`; `id` = `${slug}-q${index}` (stable for localStorage).
     Tip: since `<details>` spans multiple mdast nodes (html open, markdown children, html close), collect
     nodes between the `<details>` html node and the matching `</details>` html node.
   - `timestamps`: links in `## Video timestamps` → `{label, seconds}`.
4. Render to hast with the pipeline in §1. Replace in the React mapping:
   - `pre > code.language-mermaid` → `<Mermaid chart={text}/>` (do this as a **rehype plugin that runs before
     rehype-pretty-code** so Shiki doesn't highlight mermaid; emit `<div data-mermaid>` with the raw text).
   - `blockquote[data-alert]` → `<Callout type>`.
   - `details` → `<QnA>`; `a[href^="https://www.youtube.com/watch"]` with `t=` → `<TimestampLink>`.
   - `table` → wrapped in horizontal-scroll div (mobile).
   - `h2/h3` → anchor headings with hover `#` link.
5. Memoize everything at module level so a build parses each file once.

### Custom alerts plugin (`remark-alerts.ts`)
Detect blockquotes whose first paragraph starts with `[!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!IMPORTANT]`,
`[!INTERVIEW]` (case-insensitive). Strip the marker, set `data.hProperties = {'data-alert': type}`.
Callout styles: NOTE = blue/Info icon, TIP = green/Lightbulb, WARNING = amber/AlertTriangle,
IMPORTANT = violet/Star, INTERVIEW = pink/Briefcase with title "Interview angle".

### Mermaid component
- `"use client"`, dynamic `import('mermaid')` once, `mermaid.initialize({startOnLoad:false, securityLevel:'strict',
  theme: resolvedTheme==='dark'?'dark':'default', fontFamily:'Inter'})`, render with a unique id per diagram.
- Re-render on theme change. Lazy: only render when scrolled near viewport (IntersectionObserver, rootMargin 400px).
- Reserve min-height + skeleton to avoid layout shift. Wrap SVG in a horizontally scrollable container;
  click → open full-screen Dialog with pan/zoom (CSS transform + wheel/pinch; no extra lib needed).
- **On parse error: show the raw code in a `<pre>` with a small "diagram failed to render" note — never crash
  the page.**

---

## 5. Pages — detailed behavior

### 5.1 Landing `/`
- Hero: "Backend from First Principles — complete notes" + subtitle "31 chapters · ~45 hours of video ·
  placement-ready". CTA buttons: "Start chapter 1", "Interview bank", "Revise".
- **Continue card** (client): last visited chapter + scroll position % from localStorage; hidden if none.
- **Progress ring**: chapters completed / 31, questions marked known / total.
- **Course map**: modules as cards in study order; each lists its chapters with status icon (not started /
  in progress / done), duration, difficulty dot, interviewWeight stars. Module card shows module progress bar.
- Stats strip: total words, diagrams, interview questions, glossary terms (computed at build time).
- "High-yield for interviews" row: chapters with `interviewWeight >= 4`.

### 5.2 Chapter `/notes/[slug]` (most important page — make it excellent)
Three-column layout on ≥1280px: left Sidebar (chapter nav), center content (max-w ~760px prose),
right TOC. On tablet: TOC collapses into a "On this page" dropdown. On mobile: sidebar in a Sheet,
TOC as a sticky dropdown button.
Top to bottom:
1. Reading progress bar (fixed top, thin).
2. Breadcrumb: Module › Chapter.
3. `NoteHeader` + prerequisite chips (link to prereq chapters, show ✓ if completed).
4. `VideoEmbed` (collapsible, collapsed by default on mobile) — lite facade (thumbnail + play button;
   loads the YouTube iframe with `enablejsapi=1` on click). Timestamp links in the note seek this player via
   postMessage (`{"event":"command","func":"seekTo","args":[sec,true]}`), opening it if needed; fall back to
   a new tab.
5. **Tabs** across the top of the body: `Notes` (full chapter) · `Quick revise` (TL;DR + cheat sheet only) ·
   `Q&A` (interview questions only, with "show all answers" toggle). Tab state in URL hash.
6. Body rendered with typography styles; code blocks with copy button and language label.
7. Footer: `MarkComplete` button (big, satisfying check animation), PrevNext cards,
   "Edit/report an issue" link (optional, if repo exists).
- Keyboard: `j/k` next/prev section, `n/p` next/prev chapter, `m` mark complete, `/` search.
- Save last-visited slug + scroll % (throttled) to localStorage.
- `generateMetadata`: title, description=summary, OG image with chapter number + title + module color.

### 5.3 Interview bank `/interview`
- All questions from all chapters. Filters: module, chapter, "hide known", search text. Sort: chapter order /
  random. Each item is a `QnA` with "I know this" toggle (persists by question id) and link to chapter section.
- "Mock round" button: picks 10 random unknown questions weighted by chapter `interviewWeight`, shows one at a
  time: question → think timer (optional) → reveal answer → self-grade (Again / Good / Easy) which feeds the
  flashcard boxes.
- Counter: "X / Y known".

### 5.4 Flashcards `/flashcards`
- Decks: per module, "All", "Glossary terms", "Unknown only".
- Card front = question or term, back = answer/definition (rendered HTML). Flip with click/space,
  grade with 1/2/3 keys. Simple **Leitner system** (boxes 1–5, intervals 0/1/3/7/14 days) in localStorage.
- Show due count per deck.

### 5.5 Revise `/revise`
One long page: for each chapter in study order: title, TL;DR, cheat sheet. Sticky module jump bar.
"Print this" button (uses the same print CSS).

### 5.6 Glossary `/glossary`
A–Z letter jump bar, filter input, each term → definition + chapter chip linking to `/notes/slug#glossary`.
Deduplicate identical terms across chapters (show multiple chapter chips).

### 5.7 Roadmap `/roadmap`
Mermaid `flowchart TD` generated from `prerequisites` (nodes grouped by module via `subgraph`), with click
handlers navigating to chapters (`click NODE href "/notes/slug"` — requires `securityLevel:'loose'` for this
one diagram only), completed nodes styled green. Below it: a plain ordered list fallback for mobile.

### 5.8 Print / PDF `/print`
- Cover page (title, credits, date), table of contents with chapter numbers, then every chapter in order,
  each starting on a new page (`break-before: page`).
- In print CSS: force light theme, hide nav/video/buttons, expand all `<details>` (render Q&As open on this
  page), avoid breaking inside code blocks/diagrams/callouts (`break-inside: avoid`), show link URLs for
  external links only, 11pt body, A4 margins.
- Mermaid diagrams must be fully rendered before printing: render all eagerly on this page (no lazy) and show
  a "Preparing… (N/M diagrams)" banner, then enable a "Save as PDF" button that calls `window.print()`.

### 5.9 Command menu (global, ⌘K)
- Loads `/search-index.json` lazily on first open; MiniSearch with fuzzy 0.2, prefix true,
  boost `title×3, heading×2`.
- Result groups: Chapters, Sections, Interview questions, Glossary. Enter navigates to `/notes/slug#heading-id`.
- Also static actions: toggle theme, go to Interview bank / Flashcards / Revise / Print.

---

## 6. Design system

- Vibe: clean "developer docs meets study app" (think Vercel docs / Linear). Dark default, true light mode.
- Colors: zinc neutrals; primary accent **emerald-500**; one accent color per module
  (sky, emerald, violet, amber, teal, rose, orange, red, indigo) used for badges, module cards, OG images.
- Typography: Inter 16px/1.75 body for prose, headings tight tracking, JetBrains Mono for code.
  `prose-zinc dark:prose-invert`, customize `prose` so tables, inline code, and blockquotes look intentional.
- Components: rounded-xl cards, 1px borders (`border-zinc-200 / dark:border-zinc-800`), soft shadows in light
  mode only, focus rings visible. Callouts with left accent border + tinted background + icon.
- Motion: 150–200ms ease-out transitions; MarkComplete check pop; no motion when `prefers-reduced-motion`.
- Responsive: test at 375px, 768px, 1280px, 1536px. No horizontal page scroll ever (tables/diagrams/code scroll
  inside their own containers).
- Accessibility: semantic landmarks, skip-to-content link, all interactive elements keyboard reachable,
  color contrast AA, `aria-expanded` on toggles, diagrams get `role="img"` + `aria-label` (first line of chart).

---

## 7. Content lint (`npm run lint:content`, also runs in `prebuild`)

`scripts/lint-content.ts` (run with `tsx`) must check every note and print a readable report; exit 1 on errors:
- Frontmatter matches zod schema; `slug` matches filename; `order` matches filename `NN`; `videoId` exists in
  `data/playlist.json`; every `prerequisites` slug exists; `module` is one of the 9 modules.
- Required `##` sections present (TL;DR, Interview questions, Cheat sheet, Glossary, Video timestamps).
- Every `<details>` has a matching `</details>` and a `<summary>`.
- **Mermaid validation**: extract every mermaid block and run `mermaid.parse()` in Node using `jsdom` as the
  global DOM (set `globalThis.window/document/DOMPurify` before importing mermaid). Report file + block index +
  error. If jsdom-based parsing proves impossible, fall back to a heuristic check (first line is a known diagram
  type; brackets/quotes balanced; no `end` node ids) and mark it as a warning.
- Warnings (not errors): fewer than 3 diagrams, fewer than 5 questions, chapter under 1,000 words.

**Then FIX every reported Mermaid error directly in the note files** (minimal edits: quote labels, remove
illegal characters, rename reserved ids). This is the only content editing allowed.

---

## 8. Phased build order (commit after each phase)

1. **Scaffold** — `npx create-next-app@latest . --ts --tailwind --app --eslint --no-src-dir --import-alias "@/*"`
   (the directory is not empty: create in a temp dir and move files in, or answer prompts accordingly; do NOT
   delete `content/`, `data/`, `scripts/`, `NOTES_SPEC.md`, `PLAN.md`). Init shadcn, add fonts, theme, header,
   footer. `git init`, `.gitignore` must include `node_modules`, `.next`, `.vercel`, `.env*`, **`data/`**
   (transcripts stay local; nothing in the app reads it at build time except lint, which must skip the
   playlist check gracefully when `data/` is absent — on Vercel). Add `.vercelignore` with `data/`.
2. **Content layer** — `lib/schema.ts`, `lib/content.ts`, `lib/markdown.ts`, alerts plugin, lint script.
   Run lint, fix Mermaid errors in notes.
3. **Chapter page** — full §5.2 incl. Mermaid, callouts, code blocks, QnA, TOC, video + timestamp seeking,
   prev/next, mark complete, tabs.
4. **Navigation & landing** — sidebar, mobile nav, landing course map, /notes list, progress hooks,
   continue card.
5. **Search** — build-time index, command menu.
6. **Study tools** — /interview (+ mock round), /flashcards (Leitner), /revise, /glossary.
7. **Roadmap, print/PDF, about, SEO** — sitemap, robots, OG images, metadata, 404.
8. **Polish & QA** — Lighthouse (target ≥95 perf/a11y/SEO on chapter page), responsive pass at 4 widths,
   dark/light pass, keyboard pass, `prefers-reduced-motion`, verify every chapter renders with zero console
   errors (write a quick script that `curl`s every built route from `next start` and greps for "diagram failed
   to render").
9. **Deploy** — see §9.

---

## 9. Deploy to Vercel

```bash
npm run build                # must pass locally first (includes lint:content)
npx vercel login             # if not logged in (user may need to do this interactively)
npx vercel link              # create new project, name: backend-first-principles-notes
npx vercel --prod
```
- Framework preset: Next.js; no env vars needed.
- After deploy: open the production URL and smoke test `/`, one chapter, `/interview`, `/print`, ⌘K search.
- Report the production URL to the user.

---

## 10. Acceptance checklist

- [ ] All 31 chapters render; every Mermaid diagram renders (or degrades to code without breaking the page).
- [ ] Callouts (5 types), tables, code highlighting with copy, collapsible Q&As all styled in both themes.
- [ ] Progress (complete, known questions, flashcard boxes, last visited) persists across reloads.
- [ ] ⌘K search finds chapters, headings, questions and glossary terms.
- [ ] /print produces a clean PDF (cover, TOC, each chapter on a new page, diagrams visible, Q&As expanded).
- [ ] Mobile 375px: no horizontal scroll, nav works, video collapsible, diagrams scroll/zoom.
- [ ] `npm run build` passes with zero errors; Lighthouse ≥95 on a chapter page.
- [ ] `data/` (transcripts) is not deployed.
- [ ] Deployed on Vercel; URL reported.
- [ ] /about credits Sriniously with channel + playlist links:
      https://www.youtube.com/@sriniously · https://www.youtube.com/playlist?list=PLui3EUkuMTPgZcV0QhQrOcwMPcBCcd_Q1
</content>
</invoke>
