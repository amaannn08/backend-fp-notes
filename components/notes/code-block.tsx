"use client";

import { useRef, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";

export function CodeBlockFigure({
  children,
  ...rest
}: { children?: ReactNode } & Record<string, unknown>) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = ref.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text.replace(/\n$/, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — no-op
    }
  }

  return (
    <figure
      {...(rest as Record<string, unknown>)}
      className="group not-prose relative my-6 overflow-hidden rounded-lg border border-border"
    >
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy code"
        className="absolute right-2 top-2 z-10 rounded-md border border-border bg-background/80 p-1.5 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
      <div
        ref={ref}
        className="overflow-x-auto bg-card text-[0.85rem] [&_code]:grid [&_pre]:px-4 [&_pre]:py-4"
      >
        {children}
      </div>
    </figure>
  );
}

export function TableScroll({ children, ...rest }: { children?: ReactNode } & Record<string, unknown>) {
  return (
    <div className="my-6 overflow-x-auto rounded-md border border-border">
      <table {...(rest as Record<string, unknown>)} className="w-full">
        {children}
      </table>
    </div>
  );
}
