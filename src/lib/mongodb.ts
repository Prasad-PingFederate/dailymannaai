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
        const preview = uri.substring(0, 15);
        throw new Error(`MONGODB_URI is INVALID. It starts with "${preview}...". It MUST start with exactly 'mongodb://' or 'mongodb+srv://'. (Did you accidentally include the variable name in the value box?)`);
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
