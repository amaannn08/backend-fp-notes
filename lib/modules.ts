import {
  Compass,
  Globe,
  Boxes,
  Plug,
  Database,
  Zap,
  ShieldCheck,
  Lock,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import type { ModuleName } from "@/lib/types";

export interface ModuleDef {
  name: ModuleName;
  slug: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind color family used for badges, accents, OG images */
  color: "sky" | "emerald" | "violet" | "amber" | "teal" | "rose" | "orange" | "red" | "indigo";
  order: number;
}

export const MODULES: ModuleDef[] = [
  {
    name: "Orientation",
    slug: "orientation",
    description: "Why backend engineering matters and how to study it from first principles.",
    icon: Compass,
    color: "sky",
    order: 1,
  },
  {
    name: "Foundations",
    slug: "foundations",
    description: "The protocol and plumbing every backend sits on: HTTP, routing, serialization.",
    icon: Globe,
    color: "emerald",
    order: 2,
  },
  {
    name: "Core Building Blocks",
    slug: "core-building-blocks",
    description: "Auth, validation, and the layered architecture behind every real service.",
    icon: Boxes,
    color: "violet",
    order: 3,
  },
  {
    name: "API Design",
    slug: "api-design",
    description: "Designing contracts clients can trust: REST, OpenAPI, and webhooks.",
    icon: Plug,
    color: "amber",
    order: 4,
  },
  {
    name: "Data Layer",
    slug: "data-layer",
    description: "Postgres, caching, search, and object storage — where state actually lives.",
    icon: Database,
    color: "teal",
    order: 5,
  },
  {
    name: "Async & Real-time",
    slug: "async-and-real-time",
    description: "Background jobs, queues, and pushing data to clients the moment it changes.",
    icon: Zap,
    color: "rose",
    order: 6,
  },
  {
    name: "Reliability & Operations",
    slug: "reliability-and-operations",
    description: "Making backends that fail gracefully, observe themselves, and ship safely.",
    icon: ShieldCheck,
    color: "orange",
    order: 7,
  },
  {
    name: "Security",
    slug: "security",
    description: "Attacks, defenses, and the mindset that keeps a backend from being the headline.",
    icon: Lock,
    color: "red",
    order: 8,
  },
  {
    name: "Performance & Scale",
    slug: "performance-and-scale",
    description: "Scaling a backend from one box to a system-design-interview-ready architecture.",
    icon: Gauge,
    color: "indigo",
    order: 9,
  },
];

export const MODULE_BY_NAME: Record<string, ModuleDef> = Object.fromEntries(
  MODULES.map((m) => [m.name, m])
);

export function getModule(name: string): ModuleDef {
  const mod = MODULE_BY_NAME[name];
  if (!mod) throw new Error(`Unknown module: ${name}`);
  return mod;
}

/** Tailwind-safe static class maps, keyed by color — avoids dynamic class-name interpolation. */
export const MODULE_COLOR_CLASSES: Record<
  ModuleDef["color"],
  { badge: string; border: string; text: string; bg: string; ring: string; dot: string }
> = {
  sky: {
    badge: "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-400",
    border: "border-sky-500/30",
    text: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10",
    ring: "ring-sky-500/30",
    dot: "bg-sky-500",
  },
  emerald: {
    badge: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400",
    border: "border-emerald-500/30",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/30",
    dot: "bg-emerald-500",
  },
  violet: {
    badge: "bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-400",
    border: "border-violet-500/30",
    text: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
    ring: "ring-violet-500/30",
    dot: "bg-violet-500",
  },
  amber: {
    badge: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
    border: "border-amber-500/30",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/30",
    dot: "bg-amber-500",
  },
  teal: {
    badge: "bg-teal-500/10 text-teal-700 border-teal-500/20 dark:text-teal-400",
    border: "border-teal-500/30",
    text: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-500/10",
    ring: "ring-teal-500/30",
    dot: "bg-teal-500",
  },
  rose: {
    badge: "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400",
    border: "border-rose-500/30",
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
    ring: "ring-rose-500/30",
    dot: "bg-rose-500",
  },
  orange: {
    badge: "bg-orange-500/10 text-orange-700 border-orange-500/20 dark:text-orange-400",
    border: "border-orange-500/30",
    text: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10",
    ring: "ring-orange-500/30",
    dot: "bg-orange-500",
  },
  red: {
    badge: "bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400",
    border: "border-red-500/30",
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    ring: "ring-red-500/30",
    dot: "bg-red-500",
  },
  indigo: {
    badge: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:text-indigo-400",
    border: "border-indigo-500/30",
    text: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/10",
    ring: "ring-indigo-500/30",
    dot: "bg-indigo-500",
  },
};
