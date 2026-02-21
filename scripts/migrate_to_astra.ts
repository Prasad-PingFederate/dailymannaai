import { getDatabase } from "../src/lib/mongodb";
import { getAstraDb } from "../src/lib/astra";
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function migrate() {
    console.log("🚛 Starting Migration: MongoDB -> DataStax Astra DB (80GB Tier)");

    // 1. Connect to MongoDB (Source)
    const mongoDb = await getDatabase();
    const mongoCollection = mongoDb.collection('sermons');
    const sermons = await mongoCollection.find({}).toArray();
    console.log(`🔍 Found ${sermons.length} sermons in MongoDB.`);

    // 2. Connect to Astra DB (Destination)
    const astraDb = getAstraDb();

    // Create/Connect to collection in Astra
    // Note: In Data API, namespaces/keyspaces are managed in the portal. 
    // We assume the 'sermons' collection name works.
    const astraCollection = astraDb.collection('sermons_archive');

    console.log("⚡ Creating collection in Astra DB if it doesn't exist...");
    try {
        await astraDb.createCollection('sermons_archive', {
            vector: {
                dimension: 768, // Standard for many embedding models, adjust if needed
                metric: 'cosine'
            },
            checkExists: false
        });
    } catch (e) {
        console.log("ℹ️ Collection might already exist, continuing...");
    }

    console.log("📤 Uploading sermons to Astra DB...");

    let successCount = 0;
    for (const sermon of sermons) {
        // Prepare for Astra (remove MongoDB _id, handle binary)
        const { _id, ...cleanSermon } = sermon;

        // Astra Data API handles JSON. We can store the compressed binary as a hex string or similar
        // if needed, but for now we'll store the clean metadata and text.
        try {
            await astraCollection.insertOne({
                ...cleanSermon,
                mongo_id: _id.toString(),
                migrated_at: new Date().toISOString()
            });
            successCount++;
            if (successCount % 50 === 0) console.log(`🚀 Migrated ${successCount} items...`);
        } catch (err) {
            console.error(`❌ Error migrating sermon "${cleanSermon.title}":`, err);
        }
    }

    console.log(`✅ SUCCESS: ${successCount} sermons migrated to DataStax Astra DB.`);
    console.log(`📦 Status: Secondary Backup (MongoDB) | Primary AI Storage (Astra DB)`);
    process.exit(0);
}

migrate().catch(err => {
    console.error("💥 Critical Migration Error:", err);
    process.exit(1);
});
