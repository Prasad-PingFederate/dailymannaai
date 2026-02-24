const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function countTodayLogs() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'DailyMannaAI';

    if (!uri) {
        console.error("MONGODB_URI is missing in .env.local");
        return;
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('training_logs');

        // Get start of today in ISO format
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayIso = today.toISOString();

        console.log(`--- 🔍 AUDITING LOGS SINCE: ${todayIso} ---\n`);

        const total = await collection.countDocuments({
            timestamp: { $gte: todayIso }
        });

        const successes = await collection.countDocuments({
            timestamp: { $gte: todayIso },
            "metadata.status": "success"
        });

        const errors = await collection.countDocuments({
            timestamp: { $gte: todayIso },
            "metadata.status": "error"
        });

        const audits = await collection.countDocuments({
            timestamp: { $gte: todayIso },
            "metadata.type": "entry_audit"
        });

        console.log(`📈 TOTAL LOG ENTRIES: ${total}`);
        console.log(`✅ SUCCESSFUL RESPONSES: ${successes}`);
        console.log(`❌ FAILED RESPONSES (ERRORS): ${errors}`);
        console.log(`🔔 USER MESSAGE AUDITS: ${audits}`);

        console.log("\n--- 🤖 BREAKDOWN BY PROVIDER ---");
        const providers = await collection.aggregate([
            { $match: { timestamp: { $gte: todayIso } } },
            { $group: { _id: "$request.provider", count: { $sum: 1 } } }
        ]).toArray();

        providers.forEach(p => {
            console.log(`- ${p._id || "Unknown"}: ${p.count} calls`);
        });

    } catch (err) {
        console.error("Error connecting to MongoDB:", err.message);
    } finally {
        await client.close();
    }
}

countTodayLogs();
