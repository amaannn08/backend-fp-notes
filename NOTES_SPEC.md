# Notes Spec — "Backend from First Principles" (Sriniously)

Every video gets ONE markdown file in `content/notes/`, named `NN-slug.md` (NN = two-digit video number from the
transcript filename, slug = short kebab-case topic, e.g. `05-http.md`, `21-scaling-part-1.md`).

Source transcripts: `data/txt/NN-<videoId>.txt` (`[MM:SS]` markers roughly every minute).
Reader: a CS student preparing for **backend placement interviews**. They will study ONLY from these notes,
so the notes must fully replace watching the video.

## Quality bar
- **Cover everything the video teaches**, in the video's order. Do not skip sub-topics. Long videos → long notes
  (a 2-hour video should produce roughly 6,000–10,000 words of notes; a 20-min video ~1,500–2,500).
- **Simple language.** Explain each concept as if to a smart 2nd-year student: first the problem, then why the
  naive approach fails, then the solution (first principles). Use analogies where they help.
- **Correct.** Fix transcription errors (ASR mistakes like "jason" → JSON, "post grass" → Postgres). Where the
  speaker is imprecise, state the precise version. You MAY add standard, well-known facts that make a concept
  complete or interview-ready, but never invent claims attributed to the speaker.
- No filler, no "in this video he says…" narration. Write as a textbook chapter.

## File format (must follow exactly — the website parses this)

```markdown
---
title: "Understanding HTTP"               # clean title, no number prefix
slug: "http"                              # same as filename slug
order: 5                                  # video number (21.1 → 21, 21.2 → 22 per filename NN)
videoId: "a3C1DMswClQ"
duration: "1:00:13"
module: "Foundations"                     # one of the modules listed below
difficulty: "beginner"                    # beginner | intermediate | advanced
summary: "One or two sentence summary of what this chapter teaches."
tags: ["http", "headers", "cors"]
prerequisites: ["what-is-backend"]        # slugs of earlier notes (may be empty)
interviewWeight: 5                        # 1–5, how often this topic shows up in backend interviews
---

## TL;DR
5–8 bullet points that capture the whole chapter.

## Why this matters
Short first-principles motivation.

## <Concept sections…>
Use `##` for major sections and `###` for sub-sections, following the video's flow.
Each concept: problem → intuition/analogy → how it actually works → example → gotchas.

## Common mistakes & misconceptions
## Interview questions
## Cheat sheet
## Glossary
## Video timestamps
```

### Required elements
1. **Diagrams — at least 3 per note (more for long videos)** as Mermaid code blocks:
   ` ```mermaid ` … ` ``` `. Use `sequenceDiagram` for request flows, `flowchart LR/TD` for architecture and
   decision flows, `stateDiagram-v2` for lifecycles, `erDiagram` for schemas, `classDiagram` sparingly.
   **Mermaid safety rules** (the site renders these; broken syntax = broken page):
   - Always wrap node labels in double quotes: `A["Client (browser)"] --> B["Load balancer"]`.
   - No `"` inside labels; no semicolons; no HTML except `<br/>` for line breaks.
   - Node IDs: plain alphanumerics only (`A1`, `LB`, `DB`), never reserved words like `end`, `graph`, `style`.
   - Sequence messages: `Client->>Server: GET /users` (avoid `;`, `#` and `{}` in message text).
   - Keep each diagram ≤ ~20 nodes; split big ideas into multiple diagrams.
2. **Callouts** using GitHub alert syntax (exactly these five kinds):
   ```
   > [!NOTE]        background/precision
   > [!TIP]         practical advice
   > [!WARNING]     common bug/pitfall/security issue
   > [!IMPORTANT]   must-remember fact
   > [!INTERVIEW]   "interviewers love asking this" + a crisp answer
   ```
3. **Code examples** with language tags (```ts, ```go, ```sql, ```http, ```bash, ```json, ```yaml). Prefer
   TypeScript/Node unless the video uses Go — then show Go (optionally TS too). Raw HTTP messages as ```http.
4. **Tables** for comparisons (e.g. PUT vs PATCH, cookies vs tokens, SQL vs NoSQL, status code classes).
5. **Interview questions**: 8–15 per note, each as a collapsible block, mixing conceptual, scenario/design, and
   "what happens if…" questions. Answers must be complete enough to say out loud in an interview:
   ```
   <details>
   <summary><strong>Q: What is the difference between authentication and authorization?</strong></summary>

   Answer in 3–8 lines, may include a small table or code.

   </details>
   ```
   (Keep the blank lines inside `<details>` so the markdown renders.)
6. **Cheat sheet**: dense bullet list / table for last-minute revision.
7. **Glossary**: `- **Term** — definition` lines.
8. **Video timestamps**: list of `- [MM:SS](https://www.youtube.com/watch?v=<id>&t=<seconds>s) — section` for every
   major section (use the `[MM:SS]` markers from the transcript; seconds = MM*60+SS; hours as H:MM:SS).

## Modules (use exactly these names)
| Module | Videos |
|---|---|
| Orientation | 01–04 |
| Foundations | 05–07 |
| Core Building Blocks | 08–10 |
| API Design | 11, 29, 30 |
| Data Layer | 12, 13, 15, 24, 25 |
| Async & Real-time | 14, 26 |
| Reliability & Operations | 16, 17, 18, 19, 27, 28, 31 |
| Security | 20 |
| Performance & Scale | 21, 22, 23 |
</content>
</invoke>
