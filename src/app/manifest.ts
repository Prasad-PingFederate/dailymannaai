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
    screenshots: [
      {
        src: "/screenshot-mobile.png",
        sizes: "390x844",
        type: "image/png",
        // @ts-ignore — form_factor not yet in TS types
        form_factor: "narrow",
        label: "DailyMannaAI on mobile",
      },
      {
        src: "/screenshot-desktop.png",
        sizes: "1280x800",
        type: "image/png",
        // @ts-ignore
        form_factor: "wide",
        label: "DailyMannaAI on desktop",
      },
    ],
    icons: [
      {
        src: "/icon-72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-128.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-152.png",
        sizes: "152x152",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Bible Search",
        short_name: "Search",
        description: "Search the Bible with AI",
        url: "/bible-explorer",
        icons: [{ src: "/icon-search.png", sizes: "96x96" }],
      },
      {
        name: "Daily Manna",
        short_name: "Today",
        description: "Read today's devotional",
        url: "/daily-manna",
        icons: [{ src: "/icon-manna.png", sizes: "96x96" }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}
