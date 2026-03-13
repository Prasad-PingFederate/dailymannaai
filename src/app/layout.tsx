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
    default: `${SITE_NAME} — ${TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "DailyMannaAI is the #1 Christian search engine powered by AI. " +
    "Discover Bible verses, prophetic insights, and Spirit-led answers " +
    "to life's deepest questions — free, consecrated, and always faithful.",
  keywords: KEYWORDS,
  authors: [{ name: "DailyMannaAI", url: BASE_URL }],
  creator: "DailyMannaAI",
  publisher: "DailyMannaAI",
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
    },
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,   // unlimited
      "max-image-preview": "large",
      "max-snippet": -1,   // full snippet
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — The Search Engine Built for the Faithful`,
    description:
      "Seek and you shall find — with AI. DailyMannaAI merges the power " +
      "of modern AI with timeless scripture. Search the Word. Find the Way.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ${TAGLINE}`,
        type: "image/png",
      },
      {
        url: `${BASE_URL}/og-image-square.png`,
        width: 600,
        height: 600,
        alt: `${SITE_NAME} logo`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@DailyMannaAI",
    creator: "@DailyMannaAI",
    title: `${SITE_NAME} — Christian AI Search Engine`,
    description: "Search the Word. Find the Way. AI-powered Bible insights, " +
      "prophetic wisdom, and daily scripture — free forever.",
    images: [{
      url: OG_IMAGE,
      alt: `${SITE_NAME} — ${TAGLINE}`,
    }],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  appLinks: {
    web: {
      url: BASE_URL,
      should_fallback: true,
    },
  },
  category: "religion",
  classification: "Christian Faith, Bible Study, AI Technology",
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
            __html: `(function(){try{var t=localStorage.getItem('dailymanna-theme');if(t){document.documentElement.setAttribute('data-theme',t);}else{var d=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.setAttribute('data-theme',d?'dark':'light');}}catch(e){}})();`,
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
          <div style={{
            position: "fixed",
            top: "14px",
            right: "18px",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <UserMenu />
            <ThemeToggle variant="pill" />
          </div>
          <StructuredData />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
