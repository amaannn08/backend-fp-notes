import { visit } from "unist-util-visit";
import type { Root, Blockquote, Paragraph, PhrasingContent } from "mdast";
import type { Transformer } from "unified";

export const ALERT_TYPES = ["note", "tip", "warning", "important", "interview"] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

const MARKER_RE = /^\s*\[!(NOTE|TIP|WARNING|IMPORTANT|INTERVIEW)\]\s*/i;

/**
 * Transforms GitHub-style alert blockquotes:
 *   > [!NOTE]
 *   > body...
 * into a blockquote hast element carrying `data-alert="note"`, consumed by the
 * <Callout> component. Must run before remark-rehype.
 */
export default function remarkAlerts(): Transformer<Root, Root> {
  return (tree) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const first = node.children[0];
      if (!first || first.type !== "paragraph") return;
      const para = first as Paragraph;
      const firstChild = para.children[0] as PhrasingContent | undefined;
      if (!firstChild || firstChild.type !== "text") return;

      const match = MARKER_RE.exec(firstChild.value);
      if (!match) return;

      const alertType = match[1].toLowerCase() as AlertType;
      const remainder = firstChild.value.slice(match[0].length);

      if (remainder.length > 0) {
        firstChild.value = remainder;
      } else {
        para.children.shift();
        if (para.children[0]?.type === "break") para.children.shift();
        if (para.children.length === 0) {
          node.children.shift();
        }
      }

      node.data = {
        ...node.data,
        hName: "blockquote",
        hProperties: {
          ...((node.data?.hProperties as Record<string, unknown>) ?? {}),
          "data-alert": alertType,
        },
      };
    });
  };
}
