import { ImageResponse } from "next/og";
import { getAllSlugs, getNoteMeta } from "@/lib/content";
import { getModule } from "@/lib/modules";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const HEX: Record<string, string> = {
  sky: "#0ea5e9",
  emerald: "#10b981",
  violet: "#8b5cf6",
  amber: "#f59e0b",
  teal: "#14b8a6",
  rose: "#f43f5e",
  orange: "#f97316",
  red: "#ef4444",
  indigo: "#6366f1",
};

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export default function ChapterOpengraphImage({ params }: { params: { slug: string } }) {
  const meta = getNoteMeta(params.slug);
  const mod = meta ? getModule(meta.module) : null;
  const accent = mod ? HEX[mod.color] : "#10b981";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#09090b",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, width: 16, height: "100%", background: accent }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: accent,
              border: `1px solid ${accent}55`,
              borderRadius: 999,
              padding: "6px 16px",
            }}
          >
            {mod?.name ?? "Backend FP"}
          </span>
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.15, maxWidth: 1000 }}>
          {meta ? `${meta.order}. ${meta.title}` : "Backend from First Principles"}
        </div>
        {meta && (
          <div style={{ fontSize: 24, color: "#a1a1aa", marginTop: 20 }}>
            {meta.duration} video · {meta.readingTime} min read
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
