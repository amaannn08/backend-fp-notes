"use client";

import { useContext, useEffect, useRef, useState, useId, type WheelEvent, type MouseEvent } from "react";
import { useTheme } from "next-themes";
import { Maximize2, X } from "lucide-react";
import { MermaidEagerContext, MermaidProgressContext } from "@/lib/mermaid-context";

let mermaidModulePromise: Promise<typeof import("mermaid")> | null = null;
function loadMermaid() {
  if (!mermaidModulePromise) {
    mermaidModulePromise = import("mermaid");
  }
  return mermaidModulePromise;
}

export async function renderChart(
  chart: string,
  id: string,
  theme: "dark" | "default",
  loose = false
): Promise<{ svg: string; bindFunctions?: (el: Element) => void } | { error: string }> {
  try {
    const { default: mermaid } = await loadMermaid();
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: loose ? "loose" : "strict",
      theme,
      fontFamily: "var(--font-inter), Inter, sans-serif",
      themeVariables: { fontSize: "15px" },
    });
    const result = await mermaid.render(id, chart);
    return result;
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

function useNearViewport<T extends HTMLElement>(rootMargin = "400px") {
  const ref = useRef<T | null>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (!ref.current || near) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [near, rootMargin]);
  return { ref, near };
}

function DiagramSurface({
  svg,
  ariaLabel,
  zoomable = false,
}: {
  svg: string;
  ariaLabel: string;
  zoomable?: boolean;
}) {
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  function onWheel(e: WheelEvent<HTMLDivElement>) {
    if (!zoomable) return;
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setTransform((t) => ({ ...t, scale: Math.min(4, Math.max(0.4, t.scale + delta)) }));
  }
  function onMouseDown(e: MouseEvent<HTMLDivElement>) {
    if (!zoomable) return;
    dragRef.current = { x: e.clientX, y: e.clientY, active: true };
  }
  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!zoomable || !dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY, active: true };
    setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }));
  }
  function endDrag() {
    dragRef.current.active = false;
  }

  return (
    <div
      className={`mermaid-container w-full ${zoomable ? "h-full cursor-grab active:cursor-grabbing overflow-hidden" : "overflow-x-auto"}`}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      role="img"
      aria-label={ariaLabel}
    >
      <div
        style={
          zoomable
            ? {
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                transformOrigin: "center",
                transition: dragRef.current.active ? "none" : "transform 0.08s ease-out",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }
            : undefined
        }
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}

export function Mermaid({ children }: { children: string }) {
  const chart = typeof children === "string" ? children : String(children ?? "");
  const baseId = useId().replace(/[:]/g, "");
  const { resolvedTheme } = useTheme();
  const { ref, near: observedNear } = useNearViewport<HTMLDivElement>();
  const eager = useContext(MermaidEagerContext);
  const reportProgress = useContext(MermaidProgressContext);
  const near = eager || observedNear;
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const reported = useRef(false);
  const firstLine = chart.trim().split("\n")[0]?.slice(0, 80) ?? "diagram";

  useEffect(() => {
    if (!near) return;
    let cancelled = false;
    setState("loading");
    renderChart(chart, `mmd-${baseId}`, resolvedTheme === "light" ? "default" : "dark").then((res) => {
      if (cancelled) return;
      if ("error" in res) {
        setError(res.error);
        setState("error");
      } else {
        setSvg(res.svg);
        setState("ready");
      }
      if (!reported.current) {
        reported.current = true;
        reportProgress?.();
      }
    });
    return () => {
      cancelled = true;
    };
    // re-render on theme change too
  }, [near, resolvedTheme, chart, baseId]);

  if (state === "error") {
    return (
      <div className="not-prose my-6 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
        <p className="mb-2 text-xs font-medium text-amber-600 dark:text-amber-400">
          Diagram failed to render — showing source
        </p>
        <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
          <code>{chart}</code>
        </pre>
      </div>
    );
  }

  return (
    <div ref={ref} className="not-prose group relative my-6 min-h-[120px] rounded-lg border border-border bg-card p-4">
      {state !== "ready" ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Expand diagram"
            className="absolute right-2 top-2 z-10 rounded-md border border-border bg-background/80 p-1.5 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <DiagramSurface svg={svg} ariaLabel={firstLine} />
        </>
      )}
      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm"
          role="dialog"
          aria-modal
        >
          <div className="flex items-center justify-between border-b border-border p-3">
            <p className="text-sm text-muted-foreground">Scroll to zoom · drag to pan</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-md border border-border p-1.5 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <DiagramSurface svg={svg} ariaLabel={firstLine} zoomable />
          </div>
        </div>
      )}
    </div>
  );
}

/** Eager, non-lazy variant used on /print and /roadmap where every diagram must be ready before printing. */
export function MermaidEager({
  chart,
  id,
  onDone,
  loose = false,
}: {
  chart: string;
  id: string;
  onDone?: () => void;
  loose?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const [svg, setSvg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    renderChart(chart, id, resolvedTheme === "light" ? "default" : "dark", loose).then((res) => {
      if (cancelled) return;
      if ("error" in res) setErr(res.error);
      else setSvg(res.svg);
      onDone?.();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (err) {
    return (
      <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
        <code>{chart}</code>
      </pre>
    );
  }
  if (!svg) {
    return <div className="h-24" />;
  }
  return <div className="mermaid-container" dangerouslySetInnerHTML={{ __html: svg }} />;
}
