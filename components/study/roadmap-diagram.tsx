"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { renderChart } from "@/components/notes/mermaid";
import { useCompletedChapters } from "@/lib/progress";
import type { NoteMeta } from "@/lib/types";

export function RoadmapDiagram({ source, notes }: { source: string; notes: NoteMeta[] }) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState("");
  const [bindFn, setBindFn] = useState<((el: Element) => void) | undefined>();
  const [error, setError] = useState("");
  const { completed } = useCompletedChapters();

  useEffect(() => {
    let cancelled = false;
    renderChart(source, "roadmap-diagram", resolvedTheme === "light" ? "default" : "dark", true).then((res) => {
      if (cancelled) return;
      if ("error" in res) setError(res.error);
      else {
        setSvg(res.svg);
        setBindFn(res.bindFunctions);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [source, resolvedTheme]);

  useEffect(() => {
    if (!svg || !containerRef.current) return;
    if (bindFn) bindFn(containerRef.current);

    for (const n of notes) {
      if (!completed.includes(n.slug)) continue;
      const group = containerRef.current.querySelector(`[id^="flowchart-N${n.order}-"]`);
      const shape = group?.querySelector<SVGElement>(".basic, .label-container, rect, polygon");
      if (shape) {
        shape.style.fill = "color-mix(in srgb, var(--color-primary) 25%, transparent)";
        shape.style.stroke = "var(--color-primary)";
      }
    }
  }, [svg, bindFn, completed, notes]);

  if (error) {
    return (
      <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
        <code>{source}</code>
      </pre>
    );
  }

  if (!svg) {
    return <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">Rendering roadmap…</div>;
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-container w-full overflow-x-auto rounded-xl border border-border bg-card p-4 [&_a]:cursor-pointer"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
