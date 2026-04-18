import { getDatabase } from "../src/lib/mongodb";

export interface Sermon {
    title: string;
    preacher: string;
    content: string;
    audioUrl?: string;
    scriptureReference?: string;
    date?: string;
    tags: string[];
}

async function seedSermons() {
    console.log("🚀 Starting Sermon Seeding...");
    const db = await getDatabase();
    const collection = db.collection('sermons');

    const sermons: Sermon[] = [
        {
            title: "Salvation by Faith",
            preacher: "John Wesley",
            content: "By grace are ye saved through faith (Ephesians 2:8). All the blessings which God hath bestowed upon man are of his mere grace, bounty, or favour; his free, undeserved favour; favour altogether undeserved; man having no claim to the least of his mercies. It was free grace that 'formed man of the dust of the ground, and breathed into him a living soul,' and stamped on that soul the image of God, and 'put all things under his feet.'",
            scriptureReference: "Ephesians 2:8",
            tags: ["Salvation", "Grace", "Faith", "Methodism"],
            date: "1738"
        },
        {
            title: "Accepted in the Beloved",
            preacher: "Charles Spurgeon",
            content: "To the praise of the glory of his grace, wherein he hath made us accepted in the beloved (Ephesians 1:6). What a grand privilege! To be accepted by God. Not because of our own works, but because we are found in Christ, the Beloved of the Father. His righteousness is our covering, His life is our life.",
            scriptureReference: "Ephesians 1:6",
            audioUrl: "https://www.spurgeongems.org/audio/221chs.mp3",
            tags: ["Grace", "Acceptance", "Christ", "Prince of Preachers"]
        },
        {
            title: "The Power of the Cross",
            preacher: "Billy Graham",
            content: "The message of the cross is foolishness to those who are perishing, but to us who are being saved it is the power of God. I have seen the cross transform the hardest criminals. I have seen it bring peace to the most troubled minds. The cross is where God's justice and God's love met.",
            scriptureReference: "1 Corinthians 1:18",
            tags: ["Cross", "Power", "Gospel", "Evangelism"]
        },
        {
            title: "The Blood of Jesus",
            preacher: "Reinhard Bonnke",
            content: "The blood of Jesus does not just cover sin, it washes it away! In Africa, I have seen the power of the blood break every chain of darkness. The devil is afraid of the blood. When we plead the blood of Jesus, victory is certain. It is the signature of God's new covenant.",
            tags: ["Blood of Jesus", "Victory", "Deliverance", "Evangelism by Fire"]
        }
    ];

    try {
        // Clear existing for fresh start (optional, maybe just upsert later)
        // await collection.deleteMany({}); 

        for (const sermon of sermons) {
            await collection.updateOne(
                { title: sermon.title, preacher: sermon.preacher },
                { $set: sermon },
                { upsert: true }
            );
        }
        console.log(`✅ Successfully seeded ${sermons.length} foundational sermons.`);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
    } finally {
        process.exit(0);
    }
}

seedSermons();
