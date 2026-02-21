import { getDatabase } from "../src/lib/mongodb";
import { getAstraDb } from "../src/lib/astra";
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkStorage() {
    console.log("📊 TRUTH ENGINE HYBRID STORAGE REPORT");
    console.log("-------------------------------------");

    // 1. MongoDB Status
    try {
        const mongoDb = await getDatabase();
        const mongoCount = await mongoDb.collection('sermons').countDocuments();
        console.log(`✅ MongoDB (Backup): ${mongoCount} items`);
    } catch (e) {
        console.log(`❌ MongoDB: Offline or error`);
    }

    // 2. Astra DB Status
    try {
        const astraDb = getAstraDb();
        const astraCol = astraDb.collection('sermons_archive');

        // Count all documents (Note: Data API countDocuments needs an upperBound)
        const totalAstra = await astraCol.countDocuments({}, { upperBound: 5000 });

        // Get sample for breakdown
        const sample = await astraCol.find({}).limit(1000).toArray();
        const breakdown: Record<string, number> = {};
        sample.forEach(s => {
            breakdown[s.preacher] = (breakdown[s.preacher] || 0) + 1;
        });

        if (totalAstra > 0) {
            console.log(`✅ Astra DB (Primary - 80GB): Active (${totalAstra} items found)`);
            console.log(`👤 Cloud Preacher Breakdown:`);
            Object.entries(breakdown).forEach(([p, c]) => console.log(`   - ${p}: ${c} messages`));
            console.log(`🚀 TRUTH ENGINE is now running on the high-capacity Astra Cloud storage.`);
        } else {
            console.log(`⚠️  Astra DB is empty. Migration pending or failed.`);
        }
    } catch (e: any) {
        console.log(`❌ Astra DB: Error connecting (${e.message})`);
    }

    console.log("-------------------------------------");
    process.exit(0);
}

checkStorage();
