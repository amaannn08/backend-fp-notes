"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "cn";
import { useLastVisited } from "@/lib/progress";

export function ContinueCard({ className }: { className?: string }) {
  const [lastVisited] = useLastVisited();
  if (!lastVisited) return null;

  return (
    <Link
      href={`/notes/${lastVisited.slug}`}
      className={cn(
        "group flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10",
        className
      )}
    >
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Continue where you left off</p>
        <p className="mt-1 truncate font-medium">{lastVisited.title}</p>
        {lastVisited.scrollPct > 0 && (
          <div className="mt-2 h-1 w-full max-w-48 overflow-hidden rounded-full bg-border">
            <div className="h-full bg-primary" style={{ width: `${Math.min(100, lastVisited.scrollPct)}%` }} />
          </div>
        )}
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
