import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS home-screen icon. iOS rounds the corners itself, so the background is full-bleed. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#10b981",
          color: "#09090b",
          fontSize: 80,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        {">_"}
      </div>
    ),
    { ...size }
  );
}
