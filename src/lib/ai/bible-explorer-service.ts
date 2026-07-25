import { streamText, embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { getDatabase } from "@/lib/mongodb";
import { BIBLE_EXPLORER_SYSTEM_PROMPT, BIBLE_EXPLORER_HUMAN_PROMPT_SUFFIX } from "./bible-explorer-prompt";

async function retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt === maxRetries) throw error;
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.warn(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error("Max retries reached");
}

const BOOK_NAMES: Record<string, string> = {
    "1": "Genesis", "2": "Exodus", "3": "Leviticus", "4": "Numbers", "5": "Deuteronomy",
    "6": "Joshua", "7": "Judges", "8": "Ruth", "9": "1 Samuel", "10": "2 Samuel",
    "11": "1 Kings", "12": "2 Kings", "13": "1 Chronicles", "14": "2 Chronicles",
    "15": "Ezra", "16": "Nehemiah", "17": "Esther", "18": "Job", "19": "Psalms",
    "20": "Proverbs", "21": "Ecclesiastes", "22": "Song of Solomon", "23": "Isaiah",
    "24": "Jeremiah", "25": "Lamentations", "26": "Ezekiel", "27": "Daniel",
    "28": "Hosea", "29": "Joel", "30": "Amos", "31": "Obadiah", "32": "Jonah",
    "33": "Micah", "34": "Nahum", "35": "Habakkuk", "36": "Zephaniah", "37": "Haggai",
    "38": "Zechariah", "39": "Malachi",
    "40": "Matthew", "41": "Mark", "42": "Luke", "43": "John", "44": "Acts",
    "45": "Romans", "46": "1 Corinthians", "47": "2 Corinthians", "48": "Galatians",
    "49": "Ephesians", "50": "Philippians", "51": "Colossians",
    "52": "1 Thessalonians", "53": "2 Thessalonians", "54": "1 Timothy", "55": "2 Timothy",
    "56": "Titus", "57": "Philemon", "58": "Hebrews", "59": "James",
    "60": "1 Peter", "61": "2 Peter", "62": "1 John", "63": "2 John", "64": "3 John",
    "65": "Jude", "66": "Revelation",
};

const GREETINGS = ["hi", "hello", "hai", "hey", "greetings", "good morning", "good afternoon", "good evening"];

function isGreeting(text: string): boolean {
    const clean = text.toLowerCase().trim().replace(/[^\w\s]/g, "");
    return GREETINGS.includes(clean);
}

export async function askBibleQuestion(question: string, history: any[] = []) {
    const queryIsGreeting = isGreeting(question);
    const searchQuery = queryIsGreeting ? "greetings peace fellowship" : question;
    const searchResult = await retryWithExponentialBackoff(() => performSimilaritySearch(searchQuery));

    const messages: any[] = [
        { role: 'system', content: BIBLE_EXPLORER_SYSTEM_PROMPT }
    ];

    for (const msg of history.slice(-20)) {
        if (msg.role === "user" || msg.role === "assistant") {
            messages.push({ role: msg.role, content: msg.content });
        }
    }

    const greetingContext = queryIsGreeting
        ? "\nThe user has greeted you. Please respond with a warm, faithful welcome like: 'Hello! It's wonderful to engage with you on matters of faith and Scripture.' but keep your unique born-again believer persona. Encourage them to ask questions about the Bible.\n"
        : "";

    messages.push({
        role: 'user',
        content: `${greetingContext}Here are relevant Bible verses from the vector database:\n${searchResult.formatted}\n\nAnswer the following question with a thorough, natural response.\n${BIBLE_EXPLORER_HUMAN_PROMPT_SUFFIX}\n\nQuestion: ${question}`
    });

    const result = await streamText({
        // @ts-ignore
        model: openai('gpt-4o'),
        messages: messages,
        temperature: 0,
        maxTokens: 2000,
    });

    // We can't return the raw result directly, we must return the iterable stream for compatibility
    return result; 
}

async function performSimilaritySearch(query: string) {
    try {
        const { embedding } = await embed({
            model: openai.embedding('text-embedding-3-large'),
            value: query,
        });

        const db = await getDatabase();
        const collection = db.collection(process.env.ASTRA_DB_COLLECTION || "openai_embedding_collection");

        // Use MongoDB Atlas Vector Search if configured, otherwise fallback to basic search
        const results = await collection.aggregate([
            {
                $vectorSearch: {
                    index: "vector_index",
                    path: "embedding",
                    queryVector: embedding,
                    numCandidates: 50,
                    limit: 5
                }
            }
        ]).toArray();

        if (!results || results.length === 0) {
            return { formatted: "No relevant Bible verses found.", verses: [] };
        }

        const verses = results.map((doc: any) => {
            const bookName = BOOK_NAMES[String(doc.b)] ?? `Book ${doc.b}`;
            const ref = `${bookName} ${doc.c}:${doc.v}`;
            return { reference: ref, similarity: doc.score ?? 0 };
        });

        const formatted = verses.map((v: any) => `${v.reference} (Similarity: ${v.similarity.toFixed(2)})`).join("\n");

        return { formatted, verses };
    } catch (e) {
        console.warn("Vector search failed (Atlas Search might not be configured):", e);
        return { formatted: "No relevant Bible verses found.", verses: [] };
    }
}
