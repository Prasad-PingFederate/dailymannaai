// src/lib/crawler/bible-engine.ts
// The Core Bible Crawler for DailyMannaAI
import axios from 'axios';
import pLimit from 'p-limit';
import { getDatabase } from '../mongodb';
import { getAstraDatabase } from '../astra-db';
import { BIBLE_BOOKS } from './sources';

// BIBLE API (KJV/ASV)
const BIBLE_API_URL = "https://bible-api.com";

interface VerseResult {
    reference: string;
    text: string;
    book: string;
    chapter: number;
    verse: number;
}

/**
 * Indexes a single Bible verse from a public API.
 */
async function indexVerse(book: string, chapter: number, verse: number) {
    try {
        const url = `${BIBLE_API_URL}/${book}+${chapter}:${verse}`;
        const response = await axios.get(url);

        if (response.status !== 200 || !response.data) {
            return null;
        }

        const data = response.data;
        const verseData = {
            reference: data.reference,
            text: data.text.trim(),
            book,
            chapter,
            verse,
            version: 'KJV',
            crawled_at: new Date()
        };

        // 1. Save to MongoDB (Local/Primary Store)
        try {
            const db = await getDatabase();
            const collection = db.collection('bible_kjv');
            await collection.updateOne(
                { reference: verseData.reference },
                { $set: verseData },
                { upsert: true }
            );
        } catch (dbErr) {
            console.warn(`[BibleIndex] MongoDB Fail: ${dbErr}`);
        }

        // 2. Save to Astra DB (Global Christian Index)
        try {
            const endpoint = process.env.ASTRA_DB_API_ENDPOINT;
            if (endpoint) {
                const astraDb = await getAstraDatabase();
                const astraCollection = astraDb.collection('bible_verses');
                await astraCollection.updateOne(
                    { reference: verseData.reference },
                    { $set: verseData },
                    { upsert: true }
                );
            }
        } catch (astraErr) {
            // Silently fail if Astra not configured/down
        }

        return verseData;

    } catch (err: any) {
        // console.error(`[BibleIndex] Verse Skip (${book} ${chapter}:${verse}): ${err.message}`);
        return null;
    }
}

/**
 * Full Bible Seeding: Indexes popular verses (+ optionally the whole Bible).
 */
export async function seedMajorBibleVerses() {
    console.log("📖 [BibleIndex] Starting Major Verses Seeding...");

    // Popular Verses to seed first
    const seeds = [
        { book: 'John', chapter: 3, verse: 16 },
        { book: 'Psalm', chapter: 23, verse: 1 },
        { book: 'Philippians', chapter: 4, verse: 13 },
        { book: 'Jeremiah', chapter: 29, verse: 11 },
        { book: 'Proverbs', chapter: 3, verse: 5 },
        { book: 'Romans', chapter: 8, verse: 28 },
        { book: 'Genesis', chapter: 1, verse: 1 },
        { book: 'Matthew', chapter: 6, verse: 33 },
        { book: 'Romans', chapter: 12, verse: 2 },
    ];

    const limit = pLimit(3);
    const results = await Promise.all(seeds.map(s => limit(() => indexVerse(s.book, s.chapter, s.verse))));

    const count = results.filter(r => r !== null).length;
    console.log(`✅ [BibleIndex] Seed Complete: ${count} major verses indexed.`);
    return { count };
}

/**
 * Indexes an entire chapter for a specific Bible Book.
 * Warning: High API load, use with care.
 */
export async function indexEntireChapter(book: string, chapter: number) {
    try {
        const url = `${BIBLE_API_URL}/${book}+${chapter}`;
        const response = await axios.get(url);

        if (response.status !== 200 || !response.data) return 0;

        const verses = response.data.verses;
        const db = await getDatabase();
        const collection = db.collection('bible_kjv');

        const operations = verses.map((v: any) => ({
            updateOne: {
                filter: { reference: `${book} ${v.chapter}:${v.verse}` },
                update: {
                    $set: {
                        reference: `${book} ${v.chapter}:${v.verse}`,
                        text: v.text.trim(),
                        book,
                        chapter: v.chapter,
                        verse: v.verse,
                        version: 'KJV',
                        crawled_at: new Date()
                    }
                },
                upsert: true
            }
        }));

        const result = await collection.bulkWrite(operations);
        console.log(`✅ [BibleIndex] ${book} ${chapter} complete: ${result.upsertedCount + result.modifiedCount} verses.`);
        return verses.length;
    } catch (err: any) {
        console.error(`❌ [BibleIndex] Chapter Error (${book} ${chapter}): ${err.message}`);
        return 0;
    }
}
