import type { MetadataRoute } from "next";

const BASE_URL = "https://www.dailymannaai.com";
const NOW = new Date().toISOString();

const BIBLE_BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", 
  "1-Samuel", "2-Samuel", "1-Kings", "2-Kings", "1-Chronicles", "2-Chronicles", "Ezra", "Nehemiah", "Esther", 
  "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song-of-Solomon", "Isaiah", "Jeremiah", "Lamentations", 
  "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", 
  "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", 
  "Romans", "1-Corinthians", "2-Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", 
  "1-Thessalonians", "2-Thessalonians", "1-Timothy", "2-Timothy", "Titus", "Philemon", "Hebrews", 
  "James", "1-Peter", "2-Peter", "1-John", "2-John", "3-John", "Jude", "Revelation"
];

// We add key translations to the sitemap to ensure they get indexed.
// This is critical for capturing international search traffic.
const LANGUAGES = [
  { code: "kjv", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "zh", name: "Chinese" },
  { code: "hi", name: "Hindi" },
  { code: "ar", name: "Arabic" },
  { code: "ja", name: "Japanese" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ko", name: "Korean" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: NOW, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/daily-manna`, lastModified: NOW, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/bible-explorer`, lastModified: NOW, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/notebook`, lastModified: NOW, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: NOW, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: NOW, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/privacy-policy`, lastModified: NOW, changeFrequency: "monthly", priority: 0.5 },
  ];

  const bibleRoutes: MetadataRoute.Sitemap = [];

  // Generate 1 URL per book for default KJV
  BIBLE_BOOKS.forEach((book) => {
    bibleRoutes.push({
      url: `${BASE_URL}/bible/${book.toLowerCase()}`,
      lastModified: NOW,
      changeFrequency: "monthly",
      priority: 0.8,
    });
    
    // Generate multi-language URLs for featured translations
    // Example: /bible/genesis?v=ja
    LANGUAGES.forEach((lang) => {
        if (lang.code === 'kjv') return; // Skip default
        bibleRoutes.push({
            url: `${BASE_URL}/bible/${book.toLowerCase()}?v=${lang.code}`,
            lastModified: NOW,
            changeFrequency: "monthly",
            priority: 0.6,
        });
    });
  });

  // Limit check: Next.js handles splitting sitemaps automatically if they exceed 50k
  return [...staticRoutes, ...bibleRoutes];
}
