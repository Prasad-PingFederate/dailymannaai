import { getCosmosContainer } from "./cosmos";
import { Question } from "@/app/blog/types";
import fs from "fs";
import path from "path";

const DATABASE_NAME = "DailyMannaDB";
const CONTAINER_NAME = "SpiritualQuestions";

async function ensureContainer() {
    const client = require("./cosmos").getCosmosClient();
    const { database } = await client.databases.createIfNotExists({ id: DATABASE_NAME });
    const { container } = await database.containers.createIfNotExists({ 
        id: CONTAINER_NAME,
        partitionKey: "/category"
    });
    return container;
}

export async function getQuestions(category?: string): Promise<Question[]> {
    try {
        const container = await ensureContainer();
        
        let querySpec;
        if (category && category !== "all") {
            querySpec = {
                query: "SELECT * FROM c WHERE c.category = @category ORDER BY c.createdAt DESC",
                parameters: [{ name: "@category", value: category }]
            };
        } else {
            querySpec = {
                query: "SELECT * FROM c ORDER BY c.createdAt DESC"
            };
        }

        const { resources } = await container.items.query(querySpec).fetchAll();
        return resources as Question[];
    } catch (err) {
        console.warn("[Questions Service] Cosmos DB failed, falling back to local JSON:", err);
        if (fs.existsSync(DATA_FILE)) {
            const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
            if (category && category !== "all") {
                return data.filter((q: any) => q.category === category) as Question[];
            }
            return data as Question[];
        }
        return [];
    }
}

export async function getQuestionBySlug(slug: string): Promise<Question | null> {
    const container = await ensureContainer();
    const { resources } = await container.items
        .query({
            query: "SELECT * FROM c WHERE c.slug = @slug",
            parameters: [{ name: "@slug", value: slug }]
        })
        .fetchAll();
    
    return resources.length > 0 ? (resources[0] as Question) : null;
}

export async function createQuestion(question: Question) {
    const container = await ensureContainer();
    // Add an 'id' field for Cosmos if it doesn't exist, using slug as id is common
    const item = { ...question, id: question.slug };
    await container.items.create(item);
}

export async function updateQuestion(slug: string, updates: Partial<Question>) {
    const container = await ensureContainer();
    const existing = await getQuestionBySlug(slug);
    if (!existing) throw new Error("Question not found");

    const updatedItem = { ...existing, ...updates, id: existing.slug };
    await container.items.upsert(updatedItem);
}

export async function deleteAllQuestions() {
    const container = await ensureContainer();
    // Cosmos doesn't have a simple 'delete all', we have to fetch and delete or recreate container
    // For simplicity in a small collection:
    const { resources } = await container.items.readAll().fetchAll();
    for (const item of resources) {
        await container.item(item.id, item.category).delete();
    }
}

// ── Migration Sync ────────────────────────────────────────────────────────────
const DATA_FILE = path.join(process.cwd(), "src", "data", "spiritual-questions.json");

export async function syncLegacyData() {
    try {
        const container = await ensureContainer();
        const { resources } = await container.items.readAll({ maxItemCount: 1 }).fetchNext();
        
        if (resources.length > 0 || !fs.existsSync(DATA_FILE)) return;

        console.log("[Cosmos Migration] Starting sync from JSON...");
        const legacyData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        for (const q of legacyData) {
            await container.items.upsert({ ...q, id: q.slug });
        }
        console.log(`[Cosmos Migration] Synced ${legacyData.length} questions to Cosmos DB`);
    } catch (e) {
        console.error("[Cosmos Migration] Failed:", e);
    }
}
