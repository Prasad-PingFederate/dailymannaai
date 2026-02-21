import { getDatabase } from "../src/lib/mongodb";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function ingestAdditionalSermons() {
    console.log("🚀 Ingesting additional landmarks...");
    const db = await getDatabase();
    const collection = db.collection('sermons');

    const additional = [
        {
            title: "Prayer and Revival",
            preacher: "Billy Graham",
            content: "Recorded in 1958. In this Hour of Decision message, Billy Graham explores the vital connection between personal prayer and spiritual revival in the nation. 'If my people, which are called by my name, shall humble themselves, and pray...'",
            scriptureReference: "2 Chronicles 7:14",
            audioUrl: "https://billygraham.org/sermons/prayer-and-revival",
            date: "1958",
            tags: ["Prayer", "Revival", "Billy Graham", "USA"]
        },
        {
            title: "The Word of God",
            preacher: "Charles Spurgeon",
            content: "The Bible is the writing of the living God. Each letter was penned by an Almighty finger. Each word in it dropped from the everlasting lips. It is a book of authority; it is a book of might.",
            scriptureReference: "Hosea 8:12",
            audioUrl: "https://www.spurgeongems.org/audio/018chs.mp3",
            tags: ["Bible", "Authority", "Word of God"]
        },
        {
            title: "The Catholic Spirit",
            preacher: "John Wesley",
            content: "Though we cannot think alike, may we not love alike? May we not be of one heart, though we are not of one opinion? Without all doubt, we may. Herein all the children of God may unite, notwithstanding these smaller differences.",
            scriptureReference: "2 Kings 10:15",
            sourceUrl: "https://wesley.nnu.edu/john-wesley/the-sermons-of-john-wesley-1872-edition/sermon-39-catholic-spirit/",
            tags: ["Unity", "Love", "Tolerance", "Catholic Spirit"],
            date: "1750"
        }
    ];

    for (const sermon of additional) {
        await collection.updateOne(
            { title: sermon.title, preacher: sermon.preacher },
            { $set: sermon },
            { upsert: true }
        );
    }
    console.log("✅ Ingested additional landmark sermons.");
    process.exit(0);
}

ingestAdditionalSermons();
