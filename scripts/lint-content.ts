/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";
import { getAllRawNotes, getAllNotesMeta } from "@/lib/content";

const REQUIRED_SECTIONS = [
  "## TL;DR",
  "## Interview questions",
  "## Cheat sheet",
  "## Glossary",
  "## Video timestamps",
];

let errors = 0;
let warnings = 0;

function fail(msg: string) {
  console.error(`  ✗ ${msg}`);
  errors++;
}
function warn(msg: string) {
  console.warn(`  ! ${msg}`);
  warnings++;
}

async function checkMermaid(content: string, file: string) {
  const blocks = [...content.matchAll(/```mermaid\n([\s\S]*?)```/g)].map((m) => m[1]);
  if (blocks.length === 0) return;
  // Lazily import mermaid with a stubbed DOMPurify, so mermaid.parse() can run in plain Node.
  const dompurify = await import("dompurify");
  const dp = dompurify.default as unknown as Record<string, unknown>;
  dp.addHook = () => {};
  dp.removeHook = () => {};
  dp.removeHooks = () => {};
  dp.sanitize = (s: unknown) => s;
  const { default: mermaid } = await import("mermaid");
  let i = 0;
  for (const block of blocks) {
    i++;
    try {
      await mermaid.parse(block, { suppressErrors: false });
    } catch (e) {
      fail(`${file}: mermaid block #${i} failed to parse — ${e instanceof Error ? e.message.split("\n")[0] : e}`);
    }
  }
}

async function main() {
  console.log("Linting content/notes/*.md ...\n");

  let playlistIds: Set<string> | null = null;
  const playlistPath = path.join(process.cwd(), "data", "playlist.json");
  if (fs.existsSync(playlistPath)) {
    const playlist = JSON.parse(fs.readFileSync(playlistPath, "utf8")) as { id: string }[];
    playlistIds = new Set(playlist.map((p) => p.id));
  } else {
    console.log("  (data/playlist.json not found — skipping videoId cross-check, expected on Vercel)\n");
  }

  // getAllRawNotes() already enforces: valid frontmatter shape, slug matches filename, order matches filename.
  let raw: ReturnType<typeof getAllRawNotes>;
  try {
    raw = getAllRawNotes();
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }

  const allSlugs = new Set(raw.map((r) => r.frontmatter.slug));

  for (const { file, frontmatter, content } of raw) {
    if (playlistIds && !playlistIds.has(frontmatter.videoId)) {
      fail(`${file}: videoId "${frontmatter.videoId}" not found in data/playlist.json`);
    }
    for (const prereq of frontmatter.prerequisites) {
      if (!allSlugs.has(prereq)) {
        fail(`${file}: prerequisite "${prereq}" does not match any note slug`);
      }
    }
    for (const section of REQUIRED_SECTIONS) {
      if (!content.includes(section)) {
        fail(`${file}: missing required section "${section}"`);
      }
    }
    const opens = (content.match(/<details>/g) ?? []).length;
    const closes = (content.match(/<\/details>/g) ?? []).length;
    const summaries = (content.match(/<summary>/g) ?? []).length;
    if (opens !== closes) {
      fail(`${file}: ${opens} <details> but ${closes} </details>`);
    }
    if (opens !== summaries) {
      fail(`${file}: ${opens} <details> but ${summaries} <summary>`);
    }

    const diagramCount = (content.match(/```mermaid/g) ?? []).length;
    if (diagramCount < 3) warn(`${file}: only ${diagramCount} mermaid diagram(s), spec asks for at least 3`);
    if (opens < 5) warn(`${file}: only ${opens} interview question(s), spec asks for 5-15+`);
    const words = content.split(/\s+/).filter(Boolean).length;
    if (words < 1000) warn(`${file}: only ${words} words`);

    await checkMermaid(content, file);
  }

  // Cross-check: getAllNotesMeta() exercises prev/next + reading-time computation without throwing.
  getAllNotesMeta();

  console.log(`\n${raw.length} notes checked — ${errors} error(s), ${warnings} warning(s).`);
  if (errors > 0) process.exit(1);
}

main();
