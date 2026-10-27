"use client";

import { useContext, useEffect, useLayoutEffect, useRef, useState, useId, type PointerEvent, type UIEvent } from "react";
import { useTheme } from "next-themes";
import { Maximize2 } from "lucide-react";
import { MermaidEagerContext, MermaidProgressContext } from "@/lib/mermaid-context";
import { DiagramViewer } from "@/components/notes/diagram-viewer";

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

/** Below this fraction of the diagram's natural width, text becomes unreadable — let it overflow and scroll instead of shrinking further. */
const MIN_READABLE_SCALE = 0.75;

function DiagramSurface({ svg, ariaLabel, onTap }: { svg: string; ariaLabel: string; onTap?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [atEnd, setAtEnd] = useState(true);
  const pointerStart = useRef<{ x: number; scrollLeft: number } | null>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    const svgEl = el?.querySelector("svg");
    if (!el || !svgEl) return;
    const vb = svgEl.viewBox?.baseVal;
    const vbWidth = vb && vb.width > 0 ? vb.width : svgEl.getBoundingClientRect().width;
    const cw = el.clientWidth;
    if (vbWidth > 0 && cw / vbWidth < MIN_READABLE_SCALE) {
      svgEl.style.maxWidth = "none";
      svgEl.style.width = `${Math.round(vbWidth * MIN_READABLE_SCALE)}px`;
      setOverflowing(true);
      setAtEnd(false);
    } else {
      svgEl.style.maxWidth = "";
      svgEl.style.width = "";
      setOverflowing(false);
    }
  }, [svg]);

  function onScroll(e: UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    pointerStart.current = { x: e.clientX, scrollLeft: e.currentTarget.scrollLeft };
  }

  function onClick() {
    if (!onTap) return;
    // Whole-surface tap-to-expand is for touch only — mouse users have the explicit button.
    if (typeof window !== "undefined" && !window.matchMedia("(pointer: coarse)").matches) return;
    const el = containerRef.current;
    const moved = pointerStart.current && el ? Math.abs(el.scrollLeft - pointerStart.current.scrollLeft) : 0;
    if (moved < 5) onTap();
  }

  return (
    <div>
      <div
        ref={containerRef}
        className="mermaid-container w-full overflow-x-auto overscroll-x-contain"
        style={overflowing && !atEnd ? { maskImage: "linear-gradient(to right, black 85%, transparent)" } : undefined}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onClick={onClick}
        role="img"
        aria-label={ariaLabel}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {overflowing && (
        <p className="mt-1.5 hidden text-center text-xs text-muted-foreground pointer-coarse:block">
          ← swipe to see the full diagram · tap to zoom →
        </p>
      )}
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
            className="hit-area absolute right-2 top-2 z-10 rounded-md border border-border bg-background/80 p-1.5 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <DiagramSurface svg={svg} ariaLabel={firstLine} onTap={() => setOpen(true)} />
        </>
      )}
      <DiagramViewer open={open} onOpenChange={setOpen} svg={svg} label={firstLine} />
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
