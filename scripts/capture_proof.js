
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function sendCaptureProof() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'DailyMannaAI';

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('training_logs');

        const timestamp = new Date().toISOString();
        const proofEntry = {
            timestamp,
            request: {
                query: "God's Faithfulness: Capture Proof Test",
                provider: "Manual-Verification-Script",
                model: "Verification-v1",
                ip: "127.0.0.1",
                userAgent: "Antigravity-Internal-Test",
                referer: "manual-script"
            },
            response: {
                answer: "Success! The DailyManna AI Logging engine is 100% active and capturing data.",
                latency: 450,
                modelUsed: "Test-Runner"
            },
            metadata: {
                test: true,
                note: "This log proves that the connection from the code to Atlas is working perfectly."
            }
        };

        const result = await collection.insertOne(proofEntry);
        console.log(`✅ CAPTURE SUCCESSFUL!`);
        console.log(`Document ID: ${result.insertedId}`);
        console.log(`Check your Atlas dashboard for: "Capture Proof Test"`);

    } catch (e) {
        console.error("❌ CAPTURE FAILED:", e.message);
    } finally {
        await client.close();
    }
}

sendCaptureProof();
