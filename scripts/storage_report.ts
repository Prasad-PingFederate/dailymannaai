import { getDatabase } from "../src/lib/mongodb";
import * as zlib from 'zlib';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkStorage() {
    console.log("📊 TRUTH ENGINE STORAGE REPORT");
    console.log("-------------------------------");

    const db = await getDatabase();
    const collection = db.collection('sermons');

    const count = await collection.countDocuments();
    const all = await collection.find({}).toArray();

    let totalUncompressedSize = 0;
    let totalCompressedSize = 0;
    let preachers: Record<string, number> = {};

    for (const doc of all) {
        preachers[doc.preacher] = (preachers[doc.preacher] || 0) + 1;

        // Estimate sizes
        if (doc.isCompressed && doc.compressedContent) {
            // MongoDB Binary objects might have a .buffer property or be a Buffer itself
            const size = doc.compressedContent.buffer ? doc.compressedContent.buffer.byteLength :
                (doc.compressedContent.length || 0);
            totalCompressedSize += size;
            totalUncompressedSize += size * 3.5;
        } else if (doc.content) {
            totalUncompressedSize += doc.content.length;
            totalCompressedSize += doc.content.length;
        }
    }

    console.log(`✅ Total Sermons Ingested: ${count}`);
    console.log(`👤 Preacher Breakdown:`);
    Object.entries(preachers).forEach(([p, c]) => console.log(`   - ${p}: ${c} messages`));

    console.log(`\n💾 Space Optimization:`);
    console.log(`   - Estimated Raw Text Size: ${(totalUncompressedSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`   - Actual DB Storage Size: ${(totalCompressedSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`   - Compression Efficiency: ${(((totalUncompressedSize - totalCompressedSize) / totalUncompressedSize) * 100).toFixed(1)}%`);

    console.log(`\n🚀 Remaining Capacity: ~${(500 - (totalCompressedSize / (1024 * 1024))).toFixed(2)} MB (at 500MB limit)`);
    console.log("-------------------------------");
    process.exit(0);
}

checkStorage();
