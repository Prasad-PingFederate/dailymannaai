import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getDatabase(): Promise<Db> {
    if (cachedClient && cachedDb) {
        return cachedDb;
    }

    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'DailyMannaAI';

    if (!uri) {
        throw new Error("MONGODB_URI is MISSING. Please add it to your Vercel Environment Variables.");
    }

    if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
        throw new Error("MONGODB_URI is INVALID. It must start with 'mongodb://' or 'mongodb+srv://'. Check your Vercel settings.");
    }

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);

    cachedClient = client;
    cachedDb = db;

    console.log(`✅ [MongoDB] Connection established to database: ${dbName}`);
    return db;
}
