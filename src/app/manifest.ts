// src/app/manifest.ts
// ─────────────────────────────────────────────────────────────
//  DailyMannaAI — Web App Manifest
//
//  WHY THIS HELPS SEO:
//  • Google rewards PWA signals with higher rankings
//  • "Install" prompts increase return visitor rate
//  • Return visitors = lower bounce rate = better rankings
//  • Enables "Add to Home Screen" on mobile (free app-like distribution)
//  • Improves Core Web Vitals scores (LCP, FID, CLS)
// ─────────────────────────────────────────────────────────────

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DailyMannaAI — Holy Spirit-Guided Search",
    short_name: "DailyManna",
    description:
      "AI-powered Christian search engine. Search the Word. Find the Way.",
    start_url: "/",
    display: "standalone",
    background_color: "#1a1208",
    theme_color: "#d4a843",
    orientation: "portrait-primary",
    lang: "en-US",
    scope: "/",
    categories: ["religion", "education", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Bible Search",
        short_name: "Search",
        description: "Search the Bible with AI",
        url: "/bible-explorer",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}
