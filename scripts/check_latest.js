
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkLatestLogs() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'DailyMannaAI';

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('training_logs');

        // Find logs from the last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const count = await collection.countDocuments({ timestamp: { $gte: oneHourAgo.toISOString() } });

        console.log(`--- DB Health Check ---`);
        console.log(`Total logs in last 60 mins: ${count}`);

        const latest = await collection.find({}).sort({ timestamp: -1 }).limit(1).toArray();
        if (latest.length > 0) {
            console.log(`Latest log timestamp: ${latest[0].timestamp}`);
            console.log(`Latest query preview: ${JSON.stringify(latest[0].request?.query).substring(0, 100)}`);
        }
    } catch (e) {
        console.error("DB check failed:", e.message);
    } finally {
        await client.close();
    }
}

checkLatestLogs();
