"use client";

import { isValidElement, type ReactNode } from "react";
import { QuestionCard } from "@/components/notes/question-card";

/** Adapts a parsed <details data-qid="..."><summary>...</summary>...</details> hast block
 *  (as produced by the chapter markdown pipeline) into <QuestionCard>. */
export function QnA(props: { children?: ReactNode; "data-qid"?: string }) {
  const qid = props["data-qid"] ?? "";
  const children = Array.isArray(props.children) ? props.children : [props.children];
  const summaryEl = children.find((c) => isValidElement(c) && c.type === "summary");
  const summaryContent =
    summaryEl && isValidElement<{ children?: ReactNode }>(summaryEl)
      ? summaryEl.props.children
      : summaryEl;
  const rest = children.filter((c) => c !== summaryEl);

  return <QuestionCard id={qid} question={summaryContent} answer={rest} />;
}
