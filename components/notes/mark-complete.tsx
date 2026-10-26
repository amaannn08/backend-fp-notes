"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompletedChapters } from "@/lib/progress";

export function MarkComplete({ slug }: { slug: string }) {
  const { isComplete, toggle } = useCompletedChapters();
  const [pop, setPop] = useState(false);
  const done = isComplete(slug);

  function handleClick() {
    toggle(slug);
    if (!done) {
      setPop(true);
      setTimeout(() => setPop(false), 300);
    }
  }

  return (
    <Button
      size="lg"
      variant={done ? "secondary" : "default"}
      onClick={handleClick}
      className={`gap-2 transition-transform ${pop ? "scale-110" : ""}`}
    >
      <Check className={`h-4 w-4 ${done ? "text-emerald-500" : ""}`} />
      {done ? "Marked as complete" : "Mark chapter complete"}
    </Button>
  );
}
