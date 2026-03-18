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

  const bibleRoutes: MetadataRoute.Sitemap = BIBLE_BOOKS.map((book) => ({
    url: `${BASE_URL}/bible/${book.toLowerCase()}`,
    lastModified: NOW,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...bibleRoutes];
}
