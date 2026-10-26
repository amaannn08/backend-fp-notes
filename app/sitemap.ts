import type { MetadataRoute } from "next";
import { getAllNotesMeta } from "@/lib/content";

const SITE_URL = "https://backend-first-principles-notes.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const notes = getAllNotesMeta();
  const staticRoutes = ["", "/notes", "/interview", "/flashcards", "/revise", "/glossary", "/roadmap", "/print", "/about"];

  return [
    ...staticRoutes.map((route) => ({
      url: `${SITE_URL}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
    ...notes.map((n) => ({
      url: `${SITE_URL}/notes/${n.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
