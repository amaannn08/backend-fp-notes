"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Minus, Plus, Maximize } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Button } from "@/components/ui/button";
import { renderChart } from "@/components/notes/mermaid";
import { useCompletedChapters } from "@/lib/progress";
import type { NoteMeta } from "@/lib/types";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);
  return isMobile;
}

export function RoadmapDiagram({ source, notes }: { source: string; notes: NoteMeta[] }) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState("");
  const [bindFn, setBindFn] = useState<((el: Element) => void) | undefined>();
  const [error, setError] = useState("");
  const { completed } = useCompletedChapters();
  const isMobile = useIsMobile();

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
    // isMobile is included because switching layouts remounts the diagram container, which needs rebinding.
  }, [svg, bindFn, completed, notes, isMobile]);

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

  const diagram = (
    <div
      ref={containerRef}
      className="mermaid-container w-full [&_a]:cursor-pointer"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );

  if (isMobile) {
    return (
      <div className="relative h-[70dvh] overflow-hidden rounded-xl border border-border bg-card">
        <TransformWrapper
          minScale={0.3}
          maxScale={6}
          limitToBounds
          fitOnInit="contain"
          onInit={(ref) => {
            ref.zoomIn(0.5, 0);
          }}
          doubleClick={{ mode: "toggle", step: 1 }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="absolute right-2 top-2 z-10 flex gap-1">
                <Button variant="outline" size="icon-sm" aria-label="Zoom out" onClick={() => zoomOut()}>
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon-sm" aria-label="Reset zoom" onClick={() => resetTransform()}>
                  <Maximize className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon-sm" aria-label="Zoom in" onClick={() => zoomIn()}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <TransformComponent wrapperClass="!h-full !w-full" contentClass="!h-full !w-full">
                {diagram}
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>
    );
  }

  return <div className="w-full overflow-x-auto rounded-xl border border-border bg-card p-4">{diagram}</div>;
}
