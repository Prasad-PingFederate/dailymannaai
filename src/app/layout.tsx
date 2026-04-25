// src/app/layout.tsx
// ─────────────────────────────────────────────────────────────
//  DailyMannaAI — Elite SEO Metadata Configuration
//  Covers: Title templates, OpenGraph, Twitter, Verification,
//          Canonical URLs, Alternate languages, Theme color,
//          Category, Classification, and more.
// ─────────────────────────────────────────────────────────────

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StructuredData from "@/components/StructuredData";
import { ThemeProvider } from "@/context/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";
import UserMenu from "@/components/UserMenu";
import BackButton from "@/components/BackButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://www.dailymannaai.com"; // Replace with actual URL if known

// ─── Reusable brand constants ───────────────────────────────
const SITE_NAME = "DailyMannaAI";
const TAGLINE = "Holy Spirit-Guided Search";
const OG_IMAGE = `${BASE_URL}/og-image.png`;  // 1200×630px

// ─── Primary long-tail & semantic keyword clusters ──────────
const KEYWORDS = [
  // Core identity
  "Christian search engine",
  "Bible AI search",
  "DailyMannaAI",
  "faith-based AI assistant",

  // Informational intent (people asking questions)
  "what does the Bible say about",
  "Bible verse finder",
  "scripture search engine",
  "AI Bible study tool",
  "Christian devotional AI",
  "Holy Spirit guided answers",

  // Prophetic / charismatic niche
  "prophetic word AI",
  "daily prophetic insights",
  "Spirit-led search engine",
  "biblical prophecy search",

  // Devotional intent
  "daily manna devotional",
  "morning Bible reading AI",
  "daily bread scripture",
  "Christian morning devotion",

  // Competitor-displacement keywords
  "better than Google for Christians",
  "Christian alternative to ChatGPT",
  "Bible-trained AI chatbot",
  "faith AI assistant free",

  // Long-tail informational
  "how to find peace in the Bible",
  "scriptures for anxiety and depression",
  "Bible verses for healing",
  "Christian guidance AI",
];

// ─── Viewport / Theme ───────────────────────────────────────
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f0e8" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1208" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// ─── Root Metadata ──────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "DailyManna AI | Christian AI Bible Search Engine",
    template: "%s | DailyManna AI",
  },
  description:
    "DailyManna AI — The world's first Christian AI search engine. Search Bible verses, get AI devotionals, sermons, and prophetic alerts in English, Telugu, Tamil, Hindi, Kannada & Malayalam. Free.",
  keywords: [
    "daily manna ai", "dailymannaai", "ai bible search", "christian ai search engine",
    "bible ai search", "spirit led ai", "ai devotional tool", "ai bible study",
    "ai bible search engine", "christian ai devotional", "bible ai tool",
    "ai powered bible study", "best ai for bible study", "ai bible questions and answers",
    "bible chat ai", "faith based ai", "daily manna devotional", "daily bible devotional ai",
    "christian daily devotional", "spirit led devotional", "daily bible verse with explanation",
    "ai daily devotionals", "what does the bible say about ai", "bible verses about anxiety ai",
    "how to study the bible with ai", "ai bible verse finder", "spirit led bible answers",
    "christian ai answers", "online bible search engine", "best bible study tool",
    "christian ai app", "faith ai tool", "bible study with artificial intelligence",
    "ai for christian faith", "christian ai bible search", "ai bible companion",
    "bible ai questions", "spirit led answers ai", "daily manna ai bible",
    "ai powered devotionals", "bible search ai", "christian search engine ai",
    "faith ai search", "ai for bible verses", "best christian ai tool", "ai sermon helper",
    "bible study ai 2026", "daily spiritual nourishment ai", "man shall not live by bread alone ai",
    "prophetic alerts ai", "bible news ai", "ai image studio bible", "ai bible notebook"
  ],
  authors: [{ name: "DailyManna AI", url: "https://www.dailymannaai.com" }],
  creator: "DailyManna AI",
  publisher: "DailyManna AI",
  alternates: {
    canonical: "https://www.dailymannaai.com",
    languages: { "en-US": "https://www.dailymannaai.com" },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.dailymannaai.com",
    siteName: "DailyManna AI",
    title: "DailyManna AI | Christian AI Bible Search Engine",
    description:
      "DailyManna AI — The world's first Christian AI search engine. Search Bible verses, get AI devotionals, sermons, and prophetic alerts in English, Telugu, Tamil, Hindi, Kannada & Malayalam. Free.",
    images: [{ url: "https://www.dailymannaai.com/og-image.png", width: 1200, height: 630, alt: "DailyManna AI — Holy Spirit-Guided Search", type: "image/png" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@DailyMannaAI",
    creator: "@DailyMannaAI",
    title: "DailyManna AI | Christian AI Bible Search Engine",
    description: "DailyManna AI — The world's first Christian AI search engine. Search Bible verses, get AI devotionals, sermons, and prophetic alerts in English, Telugu, Tamil, Hindi, Kannada & Malayalam. Free.",
    images: { url: "https://www.dailymannaai.com/og-image.png", alt: "DailyManna AI — Holy Spirit-Guided Search" },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
  category: "religion",
  referrer: "origin-when-cross-origin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Anti-flash: sets theme before React hydrates to prevent white flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('dailymanna-theme');var r=document.documentElement;if(t){r.setAttribute('data-theme',t);if(t==='dark')r.classList.add('dark');else r.classList.remove('dark');}else{var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var th=d?'dark':'light';r.setAttribute('data-theme',th);if(d)r.classList.add('dark');else r.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (e.message && (e.message.indexOf('chunk') > -1 || e.message.indexOf('Loading chunk') > -1)) {
                  console.log('Force refreshing due to chunk load error...');
                  window.location.reload();
                }
              }, true);
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&family=Cinzel:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {/* ── Fixed Dark/Light Mode Toggle & User Menu — top-right corner ── */}
          <div className="fixed top-3 right-2 sm:top-4 sm:right-4 z-[9999] flex items-center gap-2 sm:gap-3">
            <UserMenu />
            <ThemeToggle variant="pill" />
          </div>
          <BackButton />
          <StructuredData />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
