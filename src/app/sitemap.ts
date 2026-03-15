// src/app/sitemap.ts
// ─────────────────────────────────────────────────────────────
//  DailyMannaAI — Dynamic Sitemap (Next.js App Router)
//
//  WHY THIS IS BETTER THAN STATIC XML:
//  • Auto-regenerates on every build — always current
//  • Can pull real lastModified dates from your database/CMS
//  • Supports image sitemaps (major ranking signal for visuals)
//  • Supports alternate language URLs (hreflang)
//  • No manual updates ever needed
//  • Next.js submits it automatically via metadata
//
//  Google indexes pages faster when:
//    1. Priority reflects actual importance (not all 0.8)
//    2. changeFreq is honest (don't say "daily" if monthly)
//    3. lastModified is accurate (use real DB timestamps)
//    4. Image locations are included
// ─────────────────────────────────────────────────────────────

import type { MetadataRoute } from "next";

const BASE_URL = "https://www.dailymannaai.com";
const NOW = new Date().toISOString();

// ─── Static routes ────────────────────────────────────────────
//  Define every important page. Add new pages here as you build.
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  {
    url: BASE_URL,
    lastModified: NOW,
    changeFrequency: "daily",
    priority: 1.0,
  },
  {
    url: `${BASE_URL}/bible-explorer`,
    lastModified: NOW,
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/notebook`,
    lastModified: NOW,
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/about`,
    lastModified: "2026-03-14T00:00:00.000Z",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    url: `${BASE_URL}/contact`,
    lastModified: "2026-03-14T00:00:00.000Z",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: `${BASE_URL}/privacy-policy`,
    lastModified: "2026-03-14T00:00:00.000Z",
    changeFrequency: "monthly",
    priority: 0.5,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return STATIC_ROUTES;
}
