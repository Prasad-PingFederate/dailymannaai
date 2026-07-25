import { getDatabase } from "./mongodb";
import { Question } from "@/app/blog/types";
import fs from "fs";
import path from "path";

const COLLECTION_NAME = "spiritual_questions";

async function getCollection() {
    const db = await getDatabase();
    return db.collection(COLLECTION_NAME);
}

const DATA_FILE = path.join(process.cwd(), "src", "data", "spiritual-questions.json");

export async function getQuestions(category?: string): Promise<Question[]> {
    try {
        const collection = await getCollection();
        let query = {};
        if (category && category !== "all") {
            query = { category };
        }
        
        const questions = await collection.find(query).sort({ createdAt: -1 }).toArray();
        if (questions.length > 0) {
            return questions as unknown as Question[];
        }
    } catch (err) {
        console.warn("[Questions Service] MongoDB failed or empty, falling back to local JSON:", err);
    }

    // Fallback to local JSON
    if (fs.existsSync(DATA_FILE)) {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        if (category && category !== "all") {
            return data.filter((q: any) => q.category === category) as Question[];
        }
        return data as Question[];
    }
    return [];
}

export async function getQuestionBySlug(slug: string): Promise<Question | null> {
    try {
        const collection = await getCollection();
        const question = await collection.findOne({ slug });
        if (question) return question as unknown as Question;
    } catch (err) {
        console.warn("[Questions Service] MongoDB failed, falling back to local JSON:", err);
    }

    // Fallback to local JSON
    if (fs.existsSync(DATA_FILE)) {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        const found = data.find((q: any) => q.slug === slug);
        return found ? (found as Question) : null;
    }
    return null;
}

export async function createQuestion(question: Question) {
    const collection = await getCollection();
    const item = { ...question, _id: question.slug as any };
    await collection.insertOne(item);
}

export async function updateQuestion(slug: string, updates: Partial<Question>) {
    const collection = await getCollection();
    await collection.updateOne({ slug }, { $set: updates });
}

export async function deleteAllQuestions() {
    const collection = await getCollection();
    await collection.deleteMany({});
}

export async function syncLegacyData() {
    try {
        const collection = await getCollection();
        const count = await collection.countDocuments();
        
        if (count > 0 || !fs.existsSync(DATA_FILE)) return;

        console.log("[MongoDB Migration] Starting sync from JSON...");
        const legacyData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        for (const q of legacyData) {
            await collection.updateOne(
                { slug: q.slug },
                { $set: q },
                { upsert: true }
            );
        }
        console.log(`[MongoDB Migration] Synced ${legacyData.length} questions to MongoDB`);
    } catch (e) {
        console.error("[MongoDB Migration] Failed:", e);
    }
}
