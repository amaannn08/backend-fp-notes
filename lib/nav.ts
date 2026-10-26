import { BookOpen, Brain, Layers, GraduationCap, Library, Map, Printer, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/notes", label: "Chapters", icon: BookOpen, description: "All 31 chapters, grouped by module" },
  { href: "/interview", label: "Interview bank", icon: Brain, description: "Every interview question, filterable" },
  { href: "/flashcards", label: "Flashcards", icon: Layers, description: "Spaced-repetition drill" },
  { href: "/revise", label: "Revise", icon: GraduationCap, description: "TL;DR + cheat sheets, one page" },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/glossary", label: "Glossary", icon: Library, description: "Every term, A to Z" },
  { href: "/roadmap", label: "Roadmap", icon: Map, description: "Visual dependency graph" },
  { href: "/print", label: "Print / PDF", icon: Printer, description: "The whole book, one printable page" },
  { href: "/about", label: "About", icon: Info, description: "Credits and source" },
];

export const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];
