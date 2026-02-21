import { getDatabase } from "../mongodb";

export interface SearchResult {
    reference: string;
    text: string;
    score: number; // Relevance score
}

/**
 * THE BIBLE SEARCH CORE
 * Performs lexical (exact) and topical searches on your MongoDB collection.
 */
export async function searchBible(keywords: string[]): Promise<SearchResult[]> {
    try {
        const db = await getDatabase();
        const collection = db.collection('bible_kjv');

        // Create a regex to match ANY of the keywords
        const regex = new RegExp(keywords.join("|"), "i");

        // Simple text search for now
        const verses = await collection.find({
            text: { $regex: regex }
        })
            .limit(10)
            .toArray();

        return verses.map(v => ({
            reference: `${v.book} ${v.chapter}:${v.verse}`,
            text: v.text,
            score: 1.0 // Future: rank based on keyword density
        }));
    } catch (error) {
        console.error("[BibleSearch] MongoDB Error:", error);
        return [];
    }
}
