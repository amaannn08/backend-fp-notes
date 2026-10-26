import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";
import type { Root, Element } from "hast";
import type { Transformer } from "unified";

/**
 * Replaces `<pre><code class="language-mermaid">...</code></pre>` with
 * `<div data-mermaid>raw source</div>` so rehype-pretty-code/Shiki never
 * attempts to syntax-highlight diagram source. Must run before rehype-pretty-code.
 */
export default function rehypeMermaid(): Transformer<Root, Root> {
  return (tree) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "pre" || !parent || index === undefined) return;
      const code = node.children.find(
        (c): c is Element => c.type === "element" && c.tagName === "code"
      );
      if (!code) return;
      const classNames = (code.properties?.className as string[]) ?? [];
      if (!classNames.includes("language-mermaid")) return;

      const chart = toString(code);
      const replacement: Element = {
        type: "element",
        tagName: "div",
        properties: { "data-mermaid": "true" },
        children: [{ type: "text", value: chart }],
      };
      (parent as { children: Element[] }).children[index] = replacement;
    });
  };
}
