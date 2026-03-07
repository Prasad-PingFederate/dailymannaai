// src/components/StructuredData.tsx
// ─────────────────────────────────────────────────────────────
//  DailyMannaAI — JSON-LD Structured Data (Schema.org)
//
//  This is the MOST POWERFUL underused SEO signal.
//  It feeds Google's Knowledge Graph directly, enabling:
//    • Rich Results (star ratings, FAQs, breadcrumbs in SERPs)
//    • Sitelinks search box in Google
//    • Entity recognition (Google knows WHO you are)
//    • Voice search answers (Google Assistant reads these)
//    • Featured snippets priority
//
//  Add <StructuredData /> inside <body> of layout.tsx
// ─────────────────────────────────────────────────────────────

const BASE_URL = "https://www.dailymannaai.com";

// ─── 1. Organization Schema ──────────────────────────────────
//  Tells Google WHO you are. Feeds the Knowledge Panel.
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${BASE_URL}/#organization`,
  name: "DailyMannaAI",
  alternateName: ["Daily Manna AI", "DailyManna AI", "Daily Manna"],
  url: BASE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${BASE_URL}/icon-512.png`,
    width: 512,
    height: 512,
  },
  image: `${BASE_URL}/og-image.png`,
  description:
    "DailyMannaAI is a consecrated AI-powered Christian search engine " +
    "that delivers Bible-based answers, prophetic insights, and scripture " +
    "guidance to believers worldwide.",
  slogan: "Search the Word. Find the Way.",
  foundingDate: "2024",
  areaServed: "Worldwide",
  audience: {
    "@type": "Audience",
    audienceType: "Christians, Bible students, faith seekers",
  },
  knowsAbout: [
    "Bible",
    "Christianity",
    "Holy Bible",
    "New Testament",
    "Old Testament",
    "Prophetic ministry",
    "Christian devotionals",
    "Scripture study",
    "Biblical theology",
  ],
  sameAs: [
    "https://twitter.com/DailyMannaAI",
    "https://www.facebook.com/DailyMannaAI",
    "https://www.instagram.com/DailyMannaAI",
    "https://www.youtube.com/@DailyMannaAI",
    // Add your real social profiles
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Customer Support",
    availableLanguage: ["English", "Spanish", "Portuguese"],
    url: `${BASE_URL}/contact`,
  },
};

// ─── 2. WebSite Schema with Sitelinks SearchBox ──────────────
//  This adds YOUR SEARCH BAR directly in Google's results page.
//  When someone Googles "DailyMannaAI", Google shows a search
//  box powered by your site right in the SERP.
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${BASE_URL}/#website`,
  url: BASE_URL,
  name: "DailyMannaAI",
  description:
    "Holy Spirit-guided AI search engine for Christians. " +
    "Discover scriptures, prophetic insights, and Bible answers.",
  publisher: {
    "@id": `${BASE_URL}/#organization`,
  },
  inLanguage: "en-US",
  // Sitelinks SearchBox — Google will show this in your brand SERP
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

// ─── 3. WebApplication Schema ────────────────────────────────
//  Classifies you as a SOFTWARE APPLICATION — important for
//  app-related searches and Google Play/App indexing.
const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": `${BASE_URL}/#webapp`,
  name: "DailyMannaAI",
  url: BASE_URL,
  applicationCategory: "LifestyleApplication",
  applicationSubCategory: "ReligionApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    description: "Free Christian AI search engine",
  },
  featureList: [
    "AI-powered Bible search",
    "Prophetic insights",
    "Daily devotionals",
    "Scripture finder",
    "Bible verse lookup",
    "Christian Q&A",
  ],
  screenshot: `${BASE_URL}/screenshot.png`,
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    bestRating: "5",
    worstRating: "1",
    ratingCount: "847",  // Update with real numbers
  },
};

// ─── 4. FAQPage Schema ───────────────────────────────────────
//  The SINGLE BIGGEST rich result win for informational sites.
//  These FAQs appear DIRECTLY in Google search results,
//  taking up 3× the normal SERP space, and show expandable
//  answers without the user even clicking through.
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is DailyMannaAI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "DailyMannaAI is a Holy Spirit-guided AI search engine built exclusively for Christians. It uses advanced AI trained on biblical content to provide accurate scripture references, prophetic insights, and faith-based answers to life's deepest questions — completely free.",
      },
    },
    {
      "@type": "Question",
      name: "How is DailyMannaAI different from ChatGPT or Google?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Unlike general AI tools, DailyMannaAI is consecrated specifically for Christian use. It is anchored in the Bible, provides scripture-backed answers, avoids unbiblical content, and is designed to guide users deeper into God's Word rather than offering secular or spiritually neutral responses.",
      },
    },
    {
      "@type": "Question",
      name: "Is DailyMannaAI free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. DailyMannaAI is completely free to use. Our mission is to make Bible-centered AI accessible to every believer around the world, regardless of financial circumstance.",
      },
    },
    {
      "@type": "Question",
      name: "What Bible translation does DailyMannaAI use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "DailyMannaAI draws from multiple trusted translations including KJV, NIV, ESV, NKJV, NLT, and NASB, and indicates the source translation for every verse it references.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use DailyMannaAI for Bible study?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. DailyMannaAI is built for deep Bible study. You can search by topic, book, theme, character, or question. It also provides cross-references, context, and Spirit-led insights to help you understand scripture more deeply.",
      },
    },
    {
      "@type": "Question",
      name: "How do I find Bible verses about a specific topic?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Simply type your question or topic into the DailyMannaAI search bar — for example, 'Bible verses about anxiety' or 'what does God say about forgiveness' — and our AI will surface the most relevant scriptures along with context and application.",
      },
    },
    {
      "@type": "Question",
      name: "Does DailyMannaAI support prophetic ministry?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. DailyMannaAI has a dedicated prophetic insights section that surfaces biblical prophecy, prophetic themes, and Spirit-led encouragements rooted firmly in scripture.",
      },
    },
  ],
};

// ─── 5. BreadcrumbList for key pages ─────────────────────────
//  Tells Google your site structure — improves crawl depth
//  and enables breadcrumb trails in SERPs.
export const breadcrumbSchema = (
  items: { name: string; url: string }[]
) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

// ─── 6. Article Schema (for blog/devotional pages) ───────────
//  Use this on every blog post or devotional article.
//  Enables "Top Stories" carousel and article rich results.
export const articleSchema = ({
  title,
  description,
  url,
  imageUrl,
  datePublished,
  dateModified,
  authorName = "DailyMannaAI Team",
}: {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  datePublished: string;   // ISO 8601: "2026-03-07"
  dateModified: string;
  authorName?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: title,
  description,
  url,
  image: imageUrl,
  datePublished,
  dateModified,
  author: {
    "@type": "Person",
    name: authorName,
    url: `${BASE_URL}/about`,
  },
  publisher: {
    "@id": `${BASE_URL}/#organization`,
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": url,
  },
  inLanguage: "en-US",
  keywords: [
    "Bible", "Christian", "devotional", "scripture", "faith",
  ],
});

// ─── Root Structured Data Component ──────────────────────────
//  Include this in your root layout.tsx inside <body>
export default function StructuredData() {
  const schemas = [
    organizationSchema,
    websiteSchema,
    webAppSchema,
    faqSchema,
  ];

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
