import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

import { ThemeProvider } from "@/components/layout/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CommandMenu } from "@/components/search/command-menu";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://backend-first-principles-notes.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Backend from First Principles — Study Notes",
    template: "%s · Backend FP Notes",
  },
  description:
    "Complete, placement-ready study notes for the 31-video 'Backend from First Principles' playlist by Sriniously — diagrams, cheat sheets, and 392 interview questions.",
  keywords: [
    "backend engineering",
    "placement interview",
    "system design",
    "backend from first principles",
    "sriniously",
    "interview preparation",
  ],
  openGraph: {
    type: "website",
    siteName: "Backend FP Notes",
    title: "Backend from First Principles — Study Notes",
    description: "31 chapters · 305 diagrams · 392 interview questions. Study the whole playlist in one place.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Backend from First Principles — Study Notes",
    description: "31 chapters · 305 diagrams · 392 interview questions.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} flex min-h-screen flex-col`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <TooltipProvider delayDuration={150}>
            <a href="#main-content" className="skip-link">
              Skip to content
            </a>
            <Header />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
            <CommandMenu />
          </TooltipProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
