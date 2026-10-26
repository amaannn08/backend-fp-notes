import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
          background: "linear-gradient(135deg, #09090b 0%, #18181b 100%)",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 700,
              color: "#09090b",
            }}
          >
            {">"}
          </div>
          <span style={{ fontSize: 28, fontWeight: 600, color: "#a1a1aa" }}>Backend FP Notes</span>
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1, maxWidth: 1000 }}>
          Backend from First Principles
        </div>
        <div style={{ fontSize: 28, color: "#a1a1aa", marginTop: 24 }}>
          31 chapters · 305 diagrams · 392 interview questions
        </div>
      </div>
    ),
    { ...size }
  );
}
