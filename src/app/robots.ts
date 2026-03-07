// src/app/robots.ts
// ─────────────────────────────────────────────────────────────
//  DailyMannaAI — Advanced Robots Configuration
//
//  WHY robots.ts BEATS robots.txt:
//  • Generated dynamically — can be environment-aware
//  • TypeSafe — no typos that silently block your whole site
//  • Integrated with Next.js build pipeline
//
//  STRATEGY:
//  • Allow all major search crawlers
//  • Block AI training scrapers (protect your content)
//  • Block useless crawlers that waste crawl budget
//  • Protect private/API routes from indexing
//  • Point to sitemap
// ─────────────────────────────────────────────────────────────

import type { MetadataRoute } from "next";

const BASE_URL = "https://dailymanna.ai";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Rule 1: Google — full access ─────────────────────
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/_next/",
          "/admin/",
          "/dashboard/private/",
          "/*.json$",
        ],
      },

      // ── Rule 2: Google Image Bot ──────────────────────────
      //  Explicitly allow images = better Image Search ranking
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/og-image.png", "/images/"],
      },

      // ── Rule 3: Bing — full access ────────────────────────
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/", "/_next/", "/admin/"],
        crawlDelay: 1, // Bing respects this; be a good host
      },

      // ── Rule 4: Other good bots ───────────────────────────
      {
        userAgent: ["DuckDuckBot", "Slurp", "Baiduspider"],
        allow: "/",
        disallow: ["/api/", "/_next/", "/admin/"],
        crawlDelay: 2,
      },

      // ── Rule 5: Social media crawlers ─────────────────────
      //  These render your OpenGraph previews. Must have access.
      {
        userAgent: [
          "facebookexternalhit",
          "Twitterbot",
          "LinkedInBot",
          "WhatsApp",
          "Discordbot",
          "Slackbot-LinkExpanding",
          "TelegramBot",
        ],
        allow: "/",
      },

      // ── Rule 6: Block AI training scrapers ───────────────
      //  Protect your consecrated content from being scraped
      //  to train secular AI models.
      {
        userAgent: [
          "GPTBot",            // OpenAI training crawler
          "ChatGPT-User",      // ChatGPT browsing
          "CCBot",             // Common Crawl (used for GPT training)
          "anthropic-ai",      // Anthropic crawler
          "Claude-Web",        // Claude browsing
          "cohere-ai",         // Cohere
          "PerplexityBot",     // Perplexity AI
          "YouBot",            // You.com
          "ia_archiver",       // Internet Archive
          "Omgili",
          "Omgilibot",
          "FacebookBot",       // FB AI training (separate from facebookexternalhit)
          "Bytespider",        // TikTok/ByteDance scraper
        ],
        disallow: "/",
      },

      // ── Rule 7: Block bandwidth-wasting crawlers ──────────
      {
        userAgent: [
          "AhrefsBot",         // SEO tool (high crawl volume)
          "SemrushBot",        // SEO tool
          "MJ12bot",           // Majestic SEO crawler
          "DotBot",            // Moz crawler
        ],
        disallow: "/",
        // Comment out if you pay for these tools and want data
      },

      // ── Rule 8: Default for all others ───────────────────
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",         // Never index API endpoints
          "/_next/",       // Next.js internals
          "/admin/",       // Admin panel
          "/private/",     // Private user data
          "/*.json$",      // Raw JSON files
          "/search?*",     // Prevent crawl trap on search params
          "/*?page=*",     // Pagination crawl trap
        ],
        crawlDelay: 3,
      },
    ],

    // ── Sitemaps ──────────────────────────────────────────────
    //  List ALL your sitemaps here. If you later add a news
    //  sitemap or image sitemap, add them below.
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      // `${BASE_URL}/sitemap-news.xml`,    // for Google News
      // `${BASE_URL}/sitemap-images.xml`,  // for Image Search
    ],

    // ── Host ─────────────────────────────────────────────────
    host: BASE_URL,
  };
}
