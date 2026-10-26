"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton({ label = "Print this" }: { label?: string }) {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5" data-no-print>
      <Printer className="h-3.5 w-3.5" /> {label}
    </Button>
  );
}
