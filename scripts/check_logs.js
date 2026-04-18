
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkRecentLogs() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'DailyMannaAI';

    if (!uri) {
        console.error("MONGODB_URI missing in .env.local");
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('training_logs');

        const logs = await collection.find({}).sort({ timestamp: -1 }).limit(5).toArray();

        console.log("--- 🕵️‍♂️ RECENT MONGODB LOGS ---");
        if (logs.length === 0) {
            console.log("No logs found yet.");
        } else {
            logs.forEach((log, i) => {
                console.log(`[Log ${i + 1}] ${log.timestamp} | Query: ${log.request?.query || 'N/A'}`);
            });
        }
    } catch (e) {
        console.error("DB check failed:", e.message);
    } finally {
        await client.close();
    }
}

checkRecentLogs();
