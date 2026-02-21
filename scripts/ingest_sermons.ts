import { getDatabase } from "../src/lib/mongodb";
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export interface Sermon {
    title: string;
    preacher: string;
    content: string;
    audioUrl?: string;
    scriptureReference?: string;
    sourceUrl?: string;
    date?: string;
    tags: string[];
}

async function ingestSpurgeon() {
    console.log("💎 Ingesting Spurgeon Gems...");
    const filePath = path.join(process.cwd(), 'spurgeon_data', 'json', 'spurgeongems.json');
    if (!fs.existsSync(filePath)) {
        console.error("❌ Spurgeon data not found. Run git clone first.");
        return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const db = await getDatabase();
    const collection = db.collection('sermons');

    const formatted = data.map((item: any) => ({
        title: item.title,
        preacher: "Charles Spurgeon",
        content: `Sermon on ${item.verse}. Full transcript available via external audio/PDF.`,
        audioUrl: item.uri,
        scriptureReference: item.verse,
        tags: ["Charles Spurgeon", "Prince of Preachers", "Classic Sermon"],
        sourceUrl: "https://www.spurgeongems.org"
    }));

    for (const sermon of formatted) {
        await collection.updateOne(
            { title: sermon.title, preacher: sermon.preacher },
            { $set: sermon },
            { upsert: true }
        );
    }
    console.log(`✅ Ingested ${formatted.length} Spurgeon sermon entries.`);
}

async function ingestWesleyFoundational() {
    console.log("📜 Ingesting John Wesley Foundational Sermons...");
    const db = await getDatabase();
    const collection = db.collection('sermons');

    const wesleySermons: Sermon[] = [
        {
            title: "The Almost Christian",
            preacher: "John Wesley",
            content: "Preached at St. Mary's, Oxford, before the university, on July 25, 1741. 'Almost thou persuadest me to be a Christian.' Acts 26.28. And many there are who go thus far: ever since the Christian religion was in the world, there have been many in every age and nation who were almost persuaded to be Christians...",
            scriptureReference: "Acts 26:28",
            sourceUrl: "https://wesley.nnu.edu/john-wesley/the-sermons-of-john-wesley-1872-edition/sermon-2-the-almost-christian/",
            tags: ["Foundational", "Christianity", "Oxford"],
            date: "1741"
        },
        {
            title: "Salvation by Faith",
            preacher: "John Wesley",
            content: "By grace are ye saved through faith (Ephesians 2:8). All the blessings which God hath bestowed upon man are of his mere grace, bounty, or favour; his free, undeserved favour...",
            scriptureReference: "Ephesians 2:8",
            sourceUrl: "https://wesley.nnu.edu/john-wesley/the-sermons-of-john-wesley-1872-edition/sermon-1-salvation-by-faith/",
            tags: ["Grace", "Salvation"],
            date: "1738"
        }
    ];

    for (const sermon of wesleySermons) {
        await collection.updateOne(
            { title: sermon.title, preacher: sermon.preacher },
            { $set: sermon },
            { upsert: true }
        );
    }
    console.log("✅ Ingested Wesley foundational sermons.");
}

async function main() {
    await ingestSpurgeon();
    await ingestWesleyFoundational();
    process.exit(0);
}

main();
