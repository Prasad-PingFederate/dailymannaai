import { getDatabase } from "../src/lib/mongodb";
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export interface CompressedSermon {
    title: string;
    preacher: string;
    compressedContent: Buffer;
    scriptureReference?: string;
    date?: string;
    tags: string[];
    isCompressed: boolean;
}

/**
 * Compresses text to make it "lightweight" for the database.
 * This can reduce storage size by 70-80%.
 */
function compress(text: string): Buffer {
    return zlib.gzipSync(text);
}

async function ingestFromGutenberg(filePath: string, preacher: string, tags: string[]) {
    console.log(`🚀 Parsing ${preacher}'s works from ${path.basename(filePath)}...`);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return;
    }

    const rawText = fs.readFileSync(filePath, 'utf-8');
    const db = await getDatabase();
    const collection = db.collection('sermons');

    // Split logic depends on the specific Gutenberg file structure
    // For Wesley Vol 1: "SERMON I.", "SERMON II." etc.
    let sermons: any[] = [];

    if (preacher === "John Wesley") {
        const parts = rawText.split(/SERMON [A-Z]+\./);
        parts.shift(); // Remove header info
        sermons = parts.map((content, index) => {
            const lines = content.trim().split('\n');
            const title = lines[1]?.trim() || `Sermon ${index + 1}`;
            return {
                title,
                preacher,
                content: content.trim(),
                tags: [...tags, "Project Gutenberg"]
            };
        });
    } else if (preacher === "Dwight L. Moody") {
        const parts = rawText.split(/\n\n[A-Z\s]{5,}\n\n/); // Simple split by big capitalized headers
        sermons = parts.slice(2).map((content, index) => ({
            title: content.trim().split('\n')[0].substring(0, 100),
            preacher,
            content: content.trim(),
            tags: [...tags, "Moody Collection"]
        }));
    }

    console.log(`📦 Compressing and Ingesting ${sermons.length} items...`);

    for (const s of sermons) {
        if (s.content.length < 50) continue;

        // Store as compressed blob for 'lightweight' storage
        const doc: CompressedSermon = {
            title: s.title,
            preacher: s.preacher,
            compressedContent: compress(s.content),
            tags: s.tags,
            isCompressed: true
        };

        await collection.updateOne(
            { title: s.title, preacher: s.preacher },
            { $set: doc },
            { upsert: true }
        );
    }
    console.log(`✅ Finished ${preacher}.`);
}

async function ingestMLKLandmarks() {
    console.log("✊ Ingesting MLK Landmarks...");
    const db = await getDatabase();
    const collection = db.collection('sermons');

    const mlk = [
        {
            title: "I Have a Dream",
            preacher: "Martin Luther King Jr.",
            content: "I am happy to join with you today in what will go down in history as the greatest demonstration for freedom in the history of our nation. Five score years ago, a great American, in whose symbolic shadow we stand today, signed the Emancipation Proclamation...",
            tags: ["Equality", "Freedom", "Landmark"],
            date: "1963-08-28"
        },
        {
            title: "I've Been to the Mountaintop",
            preacher: "Martin Luther King Jr.",
            content: "Something is happening in Memphis; something is happening in our world... I don't know what will happen now. We've got some difficult days ahead. But it really doesn't matter with me now, because I've been to the mountaintop...",
            tags: ["Hope", "Final Sermon", "Memphis"],
            date: "1968-04-03"
        }
    ];

    for (const s of mlk) {
        await collection.updateOne(
            { title: s.title, preacher: s.preacher },
            { $set: { ...s, compressedContent: compress(s.content), isCompressed: true } },
            { upsert: true }
        );
    }
}

async function main() {
    // 1. Process Gutenberg files
    await ingestFromGutenberg(path.join(process.cwd(), 'scripts', 'wesley_sermons.txt'), "John Wesley", ["Methodism", "England"]);
    await ingestFromGutenberg(path.join(process.cwd(), 'scripts', 'moody_overcoming.txt'), "Dwight L. Moody", ["Evangelism", "Chicago"]);

    // 2. Process MLK
    await ingestMLKLandmarks();

    process.exit(0);
}

main();
