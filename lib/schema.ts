import { z } from "zod";
import { MODULES } from "@/lib/modules";
import type { ModuleName } from "@/lib/types";

const MODULE_NAMES = MODULES.map((m) => m.name) as [ModuleName, ...ModuleName[]];

export const frontmatterSchema = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug must be kebab-case"),
  order: z.number().int().min(1).max(31),
  videoId: z.string().min(5),
  duration: z.string().min(1),
  module: z.enum(MODULE_NAMES),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  summary: z.string().min(1),
  tags: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
  interviewWeight: z.number().int().min(1).max(5),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;
