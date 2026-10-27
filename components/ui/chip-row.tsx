import type { ReactNode } from "react";
import { cn } from "cn";

/** One swipeable line of chips on mobile; wraps normally from `sm` up. */
export function ChipRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "scrollbar-hide -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0",
        "[&>*]:shrink-0 [&>*]:snap-start",
        className
      )}
    >
      {children}
    </div>
  );
}
