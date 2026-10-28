import { ImageResponse } from "next/og";

const SIZES = [192, 512] as const;

export function generateStaticParams() {
  return SIZES.map((size) => ({ size: String(size) }));
}

/**
 * Home-screen / install icons referenced by app/manifest.ts.
 * Full-bleed background with the glyph inside the central safe zone, so the same image works as a maskable icon.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  const size = SIZES.find((s) => String(s) === raw) ?? 512;

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
          fontSize: size * 0.45,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        {">_"}
      </div>
    ),
    { width: size, height: size }
  );
}
