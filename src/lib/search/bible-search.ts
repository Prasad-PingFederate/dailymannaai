import { getDatabase } from "../mongodb";

export interface SearchResult {
    reference: string;
    text: string;
    score: number; // Relevance score
}

const STOPWORDS = new Set(["the", "and", "of", "to", "a", "in", "is", "it", "that", "he", "was", "for", "on", "are", "as", "with", "his", "they", "at", "be", "this", "have", "from", "or", "one", "had", "by", "word", "but", "not", "what", "all", "were", "we", "when", "your", "can", "said", "there", "use", "an", "each", "which", "she", "do", "how", "their", "if", "will", "up", "other", "about", "out", "many", "then", "them", "these", "so", "some", "her", "would", "make", "like", "him", "into", "time", "has", "look", "two", "more", "write", "go", "see", "number", "no", "way", "could", "my", "than", "first", "water", "been", "call", "who", "oil", "its", "now", "find", "long", "down", "day", "did", "get", "come", "made", "may", "part"]);

/**
 * THE BIBLE SEARCH CORE
 * Performs lexical (exact) and topical searches on your MongoDB collection.
 */
export async function searchBible(keywords: string[]): Promise<SearchResult[]> {
    try {
        const filteredKeywords = keywords
            .map(k => k.toLowerCase())
            .filter(k => k.length > 2 && !STOPWORDS.has(k));

        if (filteredKeywords.length === 0) return [];

        const db = await getDatabase();
        const collection = db.collection('bible_kjv');

        const regex = new RegExp(filteredKeywords.join("|"), "i");

        const verses = await collection.find({
            text: { $regex: regex }
        })
            .limit(20)
            .toArray();

        // Calculate relevance scores
        const scoredResults = verses.map(v => {
            let score = 0;
            const text = v.text.toLowerCase();
            filteredKeywords.forEach(k => {
                if (text.includes(k)) score += 10;
                // Reward exact whole word matches
                if (new RegExp(`\\b${k}\\b`, "i").test(text)) score += 15;
            });
            return {
                reference: `${v.book} ${v.chapter}:${v.verse}`,
                text: v.text,
                score
            };
        });

        // Sort by score descending
        return scoredResults.sort((a, b) => b.score - a.score).slice(0, 10);
    } catch (error) {
        console.error("[BibleSearch] MongoDB Error:", error);
        return [];
    }
}
