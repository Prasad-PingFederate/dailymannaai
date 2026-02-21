import { getDatabase } from "../src/lib/mongodb";
import * as dotenv from 'dotenv';
import * as zlib from 'zlib';

dotenv.config({ path: '.env.local' });

async function ingestMLKAndLandmarks() {
    console.log("📍 Ingesting MLK and other Landmarked Global Preachers...");
    const db = await getDatabase();
    const collection = db.collection('sermons');

    const corpus = [
        {
            title: "I Have a Dream",
            preacher: "Martin Luther King Jr.",
            content: `I am happy to join with you today in what will go down in history as the greatest demonstration for freedom in the history of our nation. 

Five score years ago, a great American, in whose symbolic shadow we stand today, signed the Emancipation Proclamation. This momentous decree came as a great beacon light of hope to millions of Negro slaves who had been seared in the flames of withering injustice. It came as a joyous daybreak to end the long night of their captivity.

But one hundred years later, the Negro still is not free. One hundred years later, the life of the Negro is still sadly crippled by the manacles of segregation and the chains of discrimination. One hundred years later, the Negro lives on a lonely island of poverty in the midst of a vast ocean of material prosperity. One hundred years later, the Negro is still languished in the corners of American society and finds himself an exile in his own land. And so we've come here today to dramatize a shameful condition.

In a sense we've come to our nation's capital to cash a check. When the architects of our republic wrote the magnificent words of the Constitution and the Declaration of Independence, they were signing a promissory note to which every American was to fall heir. This note was a promise that all men, yes, black men as well as white men, would be guaranteed the "unalienable Rights" of "Life, Liberty and the pursuit of Happiness."`,
            tags: ["Civil Rights", "Equality", "USA", "Landmark"],
            date: "1963-08-28"
        },
        {
            title: "Our God is Marching On",
            preacher: "Martin Luther King Jr.",
            content: `My friends, I must say to you that we must go on with the faith that unmerited suffering is redemptive. We must go on with the faith that the arc of the moral universe is long, but it bends toward justice. 

How long? Not long, because "no lie can live forever."
How long? Not long, because "you shall reap what you sow."
How long? Not long, because the arm of the moral universe is long, but it bends toward justice.
How long? Not long, because mine eyes have seen the glory of the coming of the Lord; He is trampling out the vintage where the grapes of wrath are stored; He has loosed the fateful lightning of His terrible swift sword; His truth is marching on.`,
            tags: ["Justice", "Civil Rights", "Selma"],
            date: "1965-03-25"
        },
        {
            title: "The Overcoming Life",
            preacher: "Dwight L. Moody",
            content: `I would like to have you open your Bible at the first epistle of John, fifth chapter, fourth and fifth verses: "Whatsoever is born of God overcometh the world: and this is the victory that overcometh the world, even our faith. Who is he that overcometh the world, but he that believeth that Jesus is the Son of God?"

When a battle is fought, all are anxious to know who are the victors. In these verses we are told who is to gain the victory in life. When I was converted I made this mistake: I thought the battle was already mine, the victory already won, the crown already in my grasp. I thought that old things had passed away, that all things had become new; that my old corrupt nature, the Adam life, was gone. But I found out, after serving Christ for a few months, that conversion was only like enlisting in the army, that there was a battle on hand, and that if I was to get a crown, I had to work for it and fight for it.`,
            tags: ["Faith", "Victorious Living", "Moody"],
            date: "1896"
        }
    ];

    for (const s of corpus) {
        const compressed = zlib.gzipSync(s.content);
        await collection.updateOne(
            { title: s.title, preacher: s.preacher },
            {
                $set: {
                    ...s,
                    compressedContent: compressed,
                    isCompressed: true,
                    content: s.content.substring(0, 500) + "..." // Store snippet for fast preview
                }
            },
            { upsert: true }
        );
    }
    console.log(`✅ Ingested ${corpus.length} Landmark Global sermons (Compressed).`);
    process.exit(0);
}

ingestMLKAndLandmarks();
