"use client";

import { useCallback, useState, type ReactNode } from "react";
import { Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MermaidEagerContext, MermaidProgressContext } from "@/lib/mermaid-context";

export function PrintProviders({ totalDiagrams, children }: { totalDiagrams: number; children: ReactNode }) {
  const [done, setDone] = useState(0);
  const report = useCallback(() => setDone((d) => d + 1), []);
  const ready = done >= totalDiagrams;

  return (
    <MermaidEagerContext.Provider value={true}>
      <MermaidProgressContext.Provider value={report}>
        <div data-no-print className="sticky top-14 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-2 backdrop-blur">
          <p className="text-sm text-muted-foreground">
            {ready ? `All ${totalDiagrams} diagrams rendered — ready to print.` : `Preparing diagrams… (${done}/${totalDiagrams})`}
          </p>
          <Button size="sm" onClick={() => window.print()} disabled={!ready} className="gap-1.5">
            {ready ? <Printer className="h-3.5 w-3.5" /> : <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save as PDF
          </Button>
        </div>
        {children}
      </MermaidProgressContext.Provider>
    </MermaidEagerContext.Provider>
  );
}
