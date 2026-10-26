import { visit } from "unist-util-visit";
import type { Root, Element } from "hast";
import type { Transformer } from "unified";

/**
 * Assigns a stable `data-qid="{slug}-q{n}"` to every <details> (interview Q&A)
 * element in document order, so client components can persist "known" state
 * by id across reloads.
 */
export default function rehypeTagQuestions(slug: string): () => Transformer<Root, Root> {
  return () => (tree) => {
    let n = 0;
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "details") return;
      n += 1;
      node.properties = { ...node.properties, "data-qid": `${slug}-q${n}` };
    });
  };
}
