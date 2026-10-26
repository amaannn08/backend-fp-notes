import type { ReactNode } from "react";
import { Info, Lightbulb, AlertTriangle, Star, Briefcase } from "lucide-react";
import type { AlertType } from "@/lib/remark-alerts";

const CONFIG: Record<
  AlertType,
  { label: string; icon: typeof Info; className: string; iconClassName: string }
> = {
  note: {
    label: "Note",
    icon: Info,
    className: "border-sky-500/30 bg-sky-500/[0.07]",
    iconClassName: "text-sky-500",
  },
  tip: {
    label: "Tip",
    icon: Lightbulb,
    className: "border-emerald-500/30 bg-emerald-500/[0.07]",
    iconClassName: "text-emerald-500",
  },
  warning: {
    label: "Watch out",
    icon: AlertTriangle,
    className: "border-amber-500/30 bg-amber-500/[0.07]",
    iconClassName: "text-amber-500",
  },
  important: {
    label: "Remember",
    icon: Star,
    className: "border-violet-500/30 bg-violet-500/[0.07]",
    iconClassName: "text-violet-500",
  },
  interview: {
    label: "Interview angle",
    icon: Briefcase,
    className: "border-pink-500/30 bg-pink-500/[0.07]",
    iconClassName: "text-pink-500",
  },
};

export function Callout({
  type,
  children,
}: {
  type: AlertType;
  children: ReactNode;
}) {
  const cfg = CONFIG[type] ?? CONFIG.note;
  const Icon = cfg.icon;
  return (
    <div
      className={`not-prose my-6 flex gap-3 rounded-lg border-l-4 border p-4 text-[0.95rem] leading-7 ${cfg.className}`}
      role="note"
    >
      <Icon className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${cfg.iconClassName}`} aria-hidden />
      <div className="min-w-0 flex-1 [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_p]:my-2 [&_ul]:my-2 [&_a]:underline [&_code]:rounded [&_code]:bg-background/60 [&_code]:px-1 [&_code]:py-0.5">
        <p className="mb-1 text-xs font-semibold tracking-wide uppercase opacity-80">
          {cfg.label}
        </p>
        {children}
      </div>
    </div>
  );
}
