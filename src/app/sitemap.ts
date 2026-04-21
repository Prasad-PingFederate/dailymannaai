import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

const BASE_URL = "https://www.dailymannaai.com";
const NOW = new Date().toISOString();

function readSpiritualQuestions() {
  try {
    const dataFile = path.join(process.cwd(), "src", "data", "spiritual-questions.json");
    if (!fs.existsSync(dataFile)) return [];
    return JSON.parse(fs.readFileSync(dataFile, "utf-8")) as { slug: string; createdAt: string }[];
  } catch {
    return [];
  }
}

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

// Key translations to include in the sitemap for global reach.
const LANGUAGES = [
  { code: "kjv", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "zh", name: "Chinese" },
  { code: "hindi", name: "Hindi" },
  { code: "ar", name: "Arabic" },
  { code: "ja", name: "Japanese" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ko", name: "Korean" },
  { code: "tl", name: "Tagalog" },
  { code: "vi", name: "Vietnamese" },
  { code: "id", name: "Indonesian" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: NOW, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/daily-manna`, lastModified: NOW, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/bible-explorer`, lastModified: NOW, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/notebook`, lastModified: NOW, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: NOW, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: NOW, changeFrequency: "monthly", priority: 0.7 },
    // Blog routes
    { url: `${BASE_URL}/blog`, lastModified: NOW, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/blog/how-to-hear-from-god`, lastModified: NOW, changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/blog/bible-verses-about-healing`, lastModified: NOW, changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/blog/questions`, lastModified: NOW, changeFrequency: "daily", priority: 0.9 },
  ];

  const bibleRoutes: MetadataRoute.Sitemap = [];

  BIBLE_BOOKS.forEach((book) => {
    const slug = book.toLowerCase();
    
    // Default URL (KJV)
    bibleRoutes.push({
      url: `${BASE_URL}/bible/${slug}`,
      lastModified: NOW,
      changeFrequency: "monthly",
      priority: 0.8,
    });
    
    // Translation specific URLs
    LANGUAGES.forEach((lang) => {
        if (lang.code === 'kjv') return;
        bibleRoutes.push({
            url: `${BASE_URL}/bible/${slug}?v=${lang.code}`,
            lastModified: NOW,
            changeFrequency: "monthly",
            priority: 0.6,
        });
    });
  });

  // Dynamic blog question routes
  const questionData = readSpiritualQuestions();
  const questionRoutes: MetadataRoute.Sitemap = questionData.map((q) => ({
    url: `${BASE_URL}/blog/questions/${q.slug}`,
    lastModified: q.createdAt || NOW,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...bibleRoutes, ...questionRoutes];
}
