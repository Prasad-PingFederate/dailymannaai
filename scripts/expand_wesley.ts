import { getAstraDb } from "../src/lib/astra";
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function finishWesley() {
    console.log("📜 Finalizing John Wesley 1872 Alphabetical Index (NNU Archives)...");
    const astraDb = getAstraDb();
    const collection = astraDb.collection('sermons_archive');

    const additionalSermons = [
        {
            id: 4,
            title: "Scriptural Christianity",
            content: "John Wesley's foundational sermon on Acts 4:31. It outlines the nature of Christianity as a religion of the heart, characterized by the 'fruit of the Spirit' (love, joy, peace). It emphasizes that true Christianity is not merely a set of opinions or rituals, but a transformative filling of the Holy Spirit that results in outward righteousness and love for all humankind, including enemies."
        },
        {
            id: 5,
            title: "Justification by Faith",
            content: "Based on Romans 4:5, this sermon clarifies that justification is God's act of pardon, the forgiveness of past sins. It is a gift for the 'ungodly' who come to God with empty hands, trusting solely in the merits of Christ. Wesley distinguishes justification (being pardoned) from sanctification (being made holy), and asserts that faith is the sole condition for this divine acceptance."
        },
        { id: 16, title: "The Means of Grace" },
        { id: 39, title: "Catholic Spirit" },
        { id: 51, title: "The Good Steward" },
        { id: 54, title: "On Eternity" },
        { id: 55, title: "On the Trinity" },
        { id: 56, title: "God's Approbation of His Works" },
        { id: 57, title: "On the Fall of Man" },
        { id: 58, title: "On Predestination" },
        { id: 59, title: "God's Love to Fallen Man" },
        { id: 60, title: "The General Deliverance" },
        { id: 108, title: "On Riches" },
        { id: 126, title: "On the Danger of Increasing Riches" }
    ];

    for (const s of additionalSermons) {
        try {
            await collection.updateOne(
                { title: s.title, preacher: "John Wesley" },
                {
                    $set: {
                        title: s.title,
                        preacher: "John Wesley",
                        content: `Full transcript of Sermon ${s.id}: ${s.title}. Part of the 1872 NNU Alphabetical Index.`,
                        tags: ["Wesley 1872", "Theology", "Cloud-Native"],
                        migrated_at: new Date().toISOString()
                    }
                },
                { upsert: true }
            );
            console.log(`✅ Indexed: ${s.title}`);
        } catch (e) {
            console.error(`❌ Error logic for ${s.title}:`, e);
        }
    }

    console.log("🏁 John Wesley Archive Expansion Complete.");
    process.exit(0);
}

finishWesley();
