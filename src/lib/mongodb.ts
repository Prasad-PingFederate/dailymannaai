import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getDatabase(): Promise<Db> {
    if (cachedClient && cachedDb) {
        return cachedDb;
    }

    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    const dbName = process.env.MONGODB_DB || process.env.MONGO_DB_NAME || 'dailymannaai';

    if (!uri) {
        throw new Error("MONGODB_URI or MONGO_URI is MISSING. Please add it to your environment variables.");
    }

    if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
        const preview = uri.substring(0, 15);
        throw new Error(`MongoDB URI is INVALID. It starts with "${preview}...". It MUST start with exactly 'mongodb://' or 'mongodb+srv://'.`);
    }

    try {
        const client = await MongoClient.connect(uri, {
            serverSelectionTimeoutMS: 5000, // 5 second timeout
            connectTimeoutMS: 5000
        });
        const db = client.db(dbName);

        cachedClient = client;
        cachedDb = db;

        console.log(`✅ [MongoDB] Connection established to database: ${dbName}`);
        return db;
    } catch (error: any) {
        console.error(`❌ [MongoDB] Connection failed: ${error.message}`);
        throw new Error(`MONGODB_CONNECTION_ERROR: ${error.message}. (Check if Vercel IP is whitelisted in Atlas)`);
    }
}
