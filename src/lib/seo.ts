// src/lib/seo.ts
// ─────────────────────────────────────────────────────────────
//  DailyMannaAI — Per-Page SEO Utility
//
//  USE THIS ON EVERY PAGE:
//
//    import { generatePageMetadata } from "@/lib/seo";
//
//    export const metadata = generatePageMetadata({
//      title:       "Book of Psalms — AI Bible Study",
//      description: "Explore the Psalms with AI-guided insights...",
//      path:        "/bible/psalms",
//      keywords:    ["Psalms", "Psalms AI", "Psalms verses"],
//    });
//
//  This ensures EVERY page has:
//  • Unique, optimized title & description
//  • Correct canonical URL (prevents duplicate content)
//  • OpenGraph & Twitter sharing cards
//  • Consistent branding
// ─────────────────────────────────────────────────────────────

import type { Metadata } from "next";

const BASE_URL = "https://www.dailymannaai.com";
const SITE_NAME = "DailyMannaAI";
const OG_IMAGE = `${BASE_URL}/og-image.png`;

interface PageSEO {
  title: string;         // Page title (before " | DailyMannaAI")
  description: string;         // 120–155 chars
  path: string;         // e.g. "/bible/psalms"
  keywords?: string[];       // Additional page-specific keywords
  ogImage?: string;         // Custom OG image URL for this page
  ogType?: "website" | "article";
  noIndex?: boolean;        // true for private/admin pages
  publishedAt?: string;         // ISO date — for articles
  modifiedAt?: string;         // ISO date — for articles
}

export function generatePageMetadata({
  title,
  description,
  path,
  keywords = [],
  ogImage = OG_IMAGE,
  ogType = "website",
  noIndex = false,
  publishedAt,
  modifiedAt,
}: PageSEO): Metadata {
  const url = `${BASE_URL}${path}`;
  const fullTitle = `${title} | ${SITE_NAME}`;

  const baseKeywords = [
    "Christian AI", "Bible search", "DailyMannaAI", "scripture AI",
  ];

  return {
    title,   // Next.js uses the template: "%s | DailyMannaAI"
    description,
    keywords: [...baseKeywords, ...keywords],

    alternates: {
      canonical: url,
    },

    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },

    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: ogType,
      locale: "en_US",
      images: [{
        url: ogImage,
        width: 1200,
        height: 630,
        alt: title,
      }],
      ...(publishedAt && { publishedTime: publishedAt }),
      ...(modifiedAt && { modifiedTime: modifiedAt }),
    },

    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      site: "@DailyMannaAI",
      images: [ogImage],
    },
  };
}

// ─── Utility: Build BreadcrumbList for a page ────────────────
//  Use in page components alongside StructuredData
export function buildBreadcrumbs(
  crumbs: { name: string; path: string }[]
) {
  return [
    { name: "Home", url: BASE_URL },
    ...crumbs.map((c) => ({ name: c.name, url: `${BASE_URL}${c.path}` })),
  ];
}

// ─── Utility: Generate topic-cluster keywords ────────────────
//  For each topic page, generates a rich keyword set
export function topicKeywords(topic: string): string[] {
  return [
    `${topic} Bible verses`,
    `${topic} in the Bible`,
    `what does the Bible say about ${topic}`,
    `${topic} scripture`,
    `${topic} Christian`,
    `${topic} AI Bible search`,
    `${topic} devotional`,
    `${topic} prayer`,
  ];
}
