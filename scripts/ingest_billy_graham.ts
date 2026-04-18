import { getAstraDb } from "../src/lib/astra";
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function ingestBillyGraham() {
    console.log("🌟 Ingesting Landmark Billy Graham Sermons...");
    const astraDb = getAstraDb();
    const collection = astraDb.collection('sermons_archive');

    const corpus = [
        {
            title: "The Power of the Cross",
            preacher: "Billy Graham",
            content: `The Cross is the most revolutionary thing that ever came into a blind world. The Cross can take a man who is a thief, a murderer, or an adulterer, and in one moment of time, it can make him a child of the King of kings.

I am not ashamed of the Gospel of Christ, for it is the power of God unto salvation to everyone that believeth. I want to tell you today that there is life in the Cross. There is hope in the Cross. There is forgiveness in the Cross. 

When Jesus died on that Cross, He wasn't dying for His own sins. He had none. He was dying for your sins and mine. He was the substitute. He took our place. He bore the wrath of God so that we might never have to bear it.`,
            tags: ["Billy Graham", "The Cross", "Salvation", "Landmark"],
            sourceUrl: "https://singjupost.com/the-power-of-the-cross-billy-graham-sermon-transcript/"
        },
        {
            title: "Narrow is the Road",
            preacher: "Billy Graham",
            content: `Jesus said, "Enter ye in at the strait gate: for wide is the gate, and broad is the way, that leadeth to destruction, and many there be which go in thereat: because strait is the gate, and narrow is the way, which leadeth unto life, and few there be that find it." (Matthew 7:13-14)

The road to hell is wide. It's easy. It's crowded. But the road to heaven is narrow. It requires a decision. it requires a turn. It requires leaving the crowd and following the Christ.

Many people think they are on the road to heaven because they are "good people" or because they go to church. But Jesus was clear: You must be born again. You must enter through the gate.`,
            tags: ["Billy Graham", "Decision", "Heaven", "Hell"],
            sourceUrl: "https://singjupost.com/narrow-is-the-road-billy-graham-sermon-transcript/"
        },
        {
            title: "Technology, Faith and Human Shortcomings",
            preacher: "Billy Graham",
            content: `I am often asked, "Can technology save us?" And I look at the great strides we have made—the moon landing, the computer, the medical breakthroughs—and I am amazed. But then I look at the human heart. 

Technology has changed our world, but it hasn't changed our heart. We have bigger buildings but smaller tempers. Wider motorways but narrower viewpoints. We spend more but have less. We buy more but enjoy it less. 

The problem is the human heart. And the only thing that can fix the human heart is not a better computer, but a relationship with the living God.`,
            tags: ["Billy Graham", "TED Talk", "Technology", "Faith"],
            sourceUrl: "https://singjupost.com/billy-graham-on-technology-faith-and-human-shortcomings-transcript/"
        }
    ];

    for (const s of corpus) {
        try {
            await collection.updateOne(
                { title: s.title, preacher: s.preacher },
                { $set: { ...s, migrated_at: new Date().toISOString() } },
                { upsert: true }
            );
            console.log(`✅ Success: ${s.title}`);
        } catch (e) {
            console.error(`❌ Failed: ${s.title}`, e);
        }
    }

    console.log("🏁 Billy Graham Ingestion Complete.");
    process.exit(0);
}

ingestBillyGraham();
