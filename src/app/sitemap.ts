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
  // ── Tier 1: Most important pages ─────────────────────────
  {
    url: BASE_URL,
    lastModified: NOW,
    changeFrequency: "daily",   // Home changes daily (daily manna!)
    priority: 1.0,
    // Images on this page — helps Google Image Search rank you
    images: [
      `${BASE_URL}/og-image.png`,
      `${BASE_URL}/hero-image.png`,
    ],
  },

  // ── Tier 2: Core features ─────────────────────────────────
  {
    url: `${BASE_URL}/bible-explorer`,
    lastModified: NOW,
    changeFrequency: "weekly",
    priority: 0.9,
    images: [`${BASE_URL}/bible-explorer-preview.png`],
  },
  {
    url: `${BASE_URL}/notebook`,
    lastModified: NOW,
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/daily-manna`,
    lastModified: NOW,
    changeFrequency: "daily",   // Daily content = daily re-crawl
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/prophetic-insights`,
    lastModified: NOW,
    changeFrequency: "weekly",
    priority: 0.85,
  },

  // ── Tier 3: Supporting pages ──────────────────────────────
  {
    url: `${BASE_URL}/about`,
    lastModified: "2026-01-01T00:00:00.000Z",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    url: `${BASE_URL}/faq`,
    lastModified: NOW,
    changeFrequency: "monthly",
    priority: 0.75,
    // FAQs are GOLD for featured snippets
  },
  {
    url: `${BASE_URL}/blog`,
    lastModified: NOW,
    changeFrequency: "daily",
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/contact`,
    lastModified: "2026-01-01T00:00:00.000Z",
    changeFrequency: "yearly",
    priority: 0.4,
  },
  {
    url: `${BASE_URL}/privacy-policy`,
    lastModified: "2026-01-01T00:00:00.000Z",
    changeFrequency: "yearly",
    priority: 0.2,
  },
  {
    url: `${BASE_URL}/terms`,
    lastModified: "2026-01-01T00:00:00.000Z",
    changeFrequency: "yearly",
    priority: 0.2,
  },

  // ── Tier 4: Bible books (HUGE SEO opportunity) ────────────
  //  Each Bible book as a landing page = 66 indexed pages
  //  targeting "Book of Genesis AI", "Psalms Bible search" etc.
  ...getBibleBookRoutes(),
];

// ─── Bible book routes generator ─────────────────────────────
//  Creates /bible/genesis, /bible/psalms, etc.
//  Each page targeting: "[Book] Bible verses", "[Book] AI study"
function getBibleBookRoutes(): MetadataRoute.Sitemap {
  const books = [
    "genesis", "exodus", "leviticus", "numbers", "deuteronomy",
    "joshua", "judges", "ruth", "1-samuel", "2-samuel",
    "1-kings", "2-kings", "1-chronicles", "2-chronicles", "ezra",
    "nehemiah", "esther", "job", "psalms", "proverbs",
    "ecclesiastes", "song-of-solomon", "isaiah", "jeremiah", "lamentations",
    "ezekiel", "daniel", "hosea", "joel", "amos",
    "obadiah", "jonah", "micah", "nahum", "habakkuk",
    "zephaniah", "haggai", "zechariah", "malachi", "matthew",
    "mark", "luke", "john", "acts", "romans",
    "1-corinthians", "2-corinthians", "galatians", "ephesians", "philippians",
    "colossians", "1-thessalonians", "2-thessalonians", "1-timothy", "2-timothy",
    "titus", "philemon", "hebrews", "james", "1-peter",
    "2-peter", "1-john", "2-john", "3-john", "jude", "revelation",
  ];

  return books.map((book) => ({
    url: `${BASE_URL}/bible/${book}`,
    lastModified: "2026-01-01T00:00:00.000Z",
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
}

// ─── Dynamic blog/devotional routes ──────────────────────────
//  Replace this with your actual CMS/DB fetch in production.
//  Example: fetch from Sanity, Contentful, Supabase, etc.
async function getDynamicBlogRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    // EXAMPLE — replace with real data source:
    // const posts = await fetch(`${BASE_URL}/api/posts`).then(r => r.json());
    // return posts.map(post => ({
    //   url:             `${BASE_URL}/blog/${post.slug}`,
    //   lastModified:    post.updatedAt,
    //   changeFrequency: "monthly",
    //   priority:        0.75,
    // }));

    // Placeholder static posts:
    return [
      {
        url: `${BASE_URL}/blog/what-does-the-bible-say-about-anxiety`,
        lastModified: "2026-02-15T00:00:00.000Z",
        changeFrequency: "monthly",
        priority: 0.8,
      },
      {
        url: `${BASE_URL}/blog/how-to-hear-from-god`,
        lastModified: "2026-02-20T00:00:00.000Z",
        changeFrequency: "monthly",
        priority: 0.8,
      },
      {
        url: `${BASE_URL}/blog/bible-verses-about-healing`,
        lastModified: "2026-02-25T00:00:00.000Z",
        changeFrequency: "monthly",
        priority: 0.8,
      },
    ];
  } catch {
    return [];
  }
}

// ─── Main export ──────────────────────────────────────────────
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dynamicRoutes = await getDynamicBlogRoutes();
  return [...STATIC_ROUTES, ...dynamicRoutes];
}
