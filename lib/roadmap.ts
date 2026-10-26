import { MODULES } from "@/lib/modules";
import type { NoteMeta } from "@/lib/types";

function escapeLabel(text: string): string {
  return text.replace(/"/g, "'");
}

export function buildRoadmapMermaid(notes: NoteMeta[]): string {
  const slugToNode = new Map(notes.map((n) => [n.slug, `N${n.order}`]));
  const lines: string[] = ["flowchart TD"];

  for (const mod of MODULES) {
    const chapters = notes.filter((n) => n.module === mod.name).sort((a, b) => a.order - b.order);
    if (chapters.length === 0) continue;
    lines.push(`  subgraph M${mod.order}["${escapeLabel(mod.name)}"]`);
    for (const n of chapters) {
      lines.push(`    N${n.order}["${n.order}. ${escapeLabel(n.title)}"]`);
    }
    lines.push("  end");
  }

  for (const n of notes) {
    for (const prereqSlug of n.prerequisites) {
      const fromNode = slugToNode.get(prereqSlug);
      const toNode = slugToNode.get(n.slug);
      if (fromNode && toNode) lines.push(`  ${fromNode} --> ${toNode}`);
    }
  }

  for (const n of notes) {
    const nodeId = slugToNode.get(n.slug);
    lines.push(`  click ${nodeId} href "/notes/${n.slug}" "${escapeLabel(n.title)}" _self`);
  }

  return lines.join("\n");
}
