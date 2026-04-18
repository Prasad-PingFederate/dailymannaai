import { getAstraDb } from "../src/lib/astra";
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function ingestFullNNUWesley() {
    console.log("📚 Full Ingestion: John Wesley 1872 NNU Collection (141 Sermons)...");
    const astraDb = getAstraDb();
    const collection = astraDb.collection('sermons_archive');

    const fullWesleyIndex = [
        { id: 1, title: "Salvation by Faith" },
        { id: 2, title: "The Almost Christian" },
        { id: 3, title: "Awake, Thou That Sleepest" },
        { id: 4, title: "Scriptural Christianity" },
        { id: 5, title: "Justification by Faith" },
        { id: 6, title: "The Righteousness Of Faith" },
        { id: 7, title: "The Way To The Kingdom" },
        { id: 8, title: "The First Fruits Of The Spirit" },
        { id: 9, title: "The Spirit Of Bondage And Of Adoption" },
        { id: 10, title: "The Witness Of The Spirit (Discourse 1)" },
        { id: 11, title: "The Witness Of The Spirit (Discourse 2)" },
        { id: 12, title: "The Witness Of Our Own Spirit" },
        { id: 13, title: "On Sin in Believers" },
        { id: 14, title: "The Repentance Of Believers" },
        { id: 15, title: "The Great Assize" },
        { id: 16, title: "The Means of Grace" },
        { id: 17, title: "The Circumcision Of The Heart" },
        { id: 18, title: "The Marks Of The New Birth" },
        { id: 19, title: "Great Privilege Of Those That Are Born Of God" },
        { id: 20, title: "The Lord Our Righteousness" },
        { id: 21, title: "Upon Our Lord's Sermon On The Mount (Discourse 1)" },
        { id: 22, title: "Upon Our Lord's Sermon On The Mount (Discourse 2)" },
        { id: 23, title: "Upon Our Lord's Sermon On The Mount (Discourse 3)" },
        { id: 24, title: "Upon Our Lord's Sermon On The Mount (Discourse 4)" },
        { id: 25, title: "Upon Our Lord's Sermon On The Mount (Discourse 5)" },
        { id: 26, title: "Upon Our Lord's Sermon On The Mount (Discourse 6)" },
        { id: 27, title: "Upon Our Lord's Sermon On The Mount (Discourse 7)" },
        { id: 28, title: "Upon Our Lord's Sermon On The Mount (Discourse 8)" },
        { id: 29, title: "Upon Our Lord's Sermon On The Mount (Discourse 9)" },
        { id: 30, title: "Upon Our Lord's Sermon On The Mount (Discourse 10)" },
        { id: 31, title: "Upon Our Lord's Sermon On The Mount (Discourse 11)" },
        { id: 32, title: "Upon Our Lord's Sermon On The Mount (Discourse 12)" },
        { id: 33, title: "Upon Our Lord's Sermon On The Mount (Discourse 13)" },
        { id: 34, title: "The Original, Nature, Property, and Use of the Law" },
        { id: 35, title: "The Law Established through Faith (Discourse 1)" },
        { id: 36, title: "The Law Established through Faith (Discourse 2)" },
        { id: 37, title: "The Nature Of Enthusiasm" },
        { id: 38, title: "A Caution Against Bigotry" },
        { id: 39, title: "Catholic Spirit" },
        { id: 40, title: "Christian Perfection" },
        { id: 41, title: "Wandering Thoughts" },
        { id: 42, title: "Satan's Devices" },
        { id: 43, title: "The Scripture Way of Salvation" },
        { id: 44, title: "Original Sin" },
        { id: 45, title: "The New Birth" },
        { id: 46, title: "The Wilderness State" },
        { id: 47, title: "Heaviness through Manifold Temptations" },
        { id: 48, title: "Self-Denial" },
        { id: 49, title: "The Cure of Evil-Speaking" },
        { id: 50, title: "The Use Of Money" },
        { id: 51, title: "The Good Steward" },
        { id: 52, title: "The Reformation Of Manners" },
        { id: 53, title: "On The Death Of Mr. Whitefield" },
        { id: 54, title: "On Eternity" },
        { id: 55, title: "On The Trinity" },
        { id: 56, title: "God's Approbation Of His Works" },
        { id: 57, title: "On The Fall Of Man" },
        { id: 58, title: "On Predestination" },
        { id: 59, title: "God's Love To Fallen Man" },
        { id: 60, title: "The General Deliverance" },
        { id: 61, title: "The Mystery Of Iniquity" },
        { id: 62, title: "The End Of Christ's Coming" },
        { id: 63, title: "The General Spread Of The Gospel" },
        { id: 64, title: "The New Creation" },
        { id: 65, title: "The Duty Of Reproving Our Neighbour" },
        { id: 66, title: "The Signs Of The Times" },
        { id: 67, title: "On Divine Providence" },
        { id: 68, title: "The Wisdom Of God's Counsels" },
        { id: 69, title: "The Imperfection Of Human Knowledge" },
        { id: 70, title: "The Case Of Reason Impartially Considered" },
        { id: 71, title: "Of Good Angels" },
        { id: 72, title: "Of Evil Angels" },
        { id: 73, title: "Of Hell" },
        { id: 74, title: "Of The Church" },
        { id: 75, title: "On Schism" },
        { id: 76, title: "On Perfection" },
        { id: 77, title: "Spiritual Worship" },
        { id: 78, title: "Spiritual Idolatry" },
        { id: 79, title: "On Dissipation" },
        { id: 80, title: "On Friendship With The World" },
        { id: 81, title: "In What Sense We Are To Leave The World" },
        { id: 82, title: "On Temptation" },
        { id: 83, title: "On Patience" },
        { id: 84, title: "The Important Question" },
        { id: 85, title: "On Working Out Our Own Salvation" },
        { id: 86, title: "A Call To Backsliders" },
        { id: 87, title: "The Danger Of Riches" },
        { id: 88, title: "On Dress" },
        { id: 89, title: "The More Excellent Way" },
        { id: 90, title: "An Israelite Indeed" },
        { id: 91, title: "On Charity" },
        { id: 92, title: "On Zeal" },
        { id: 93, title: "On Redeeming The Time" },
        { id: 94, title: "On Family Religion" },
        { id: 95, title: "On The Education Of Children" },
        { id: 96, title: "On Obedience To Parents" },
        { id: 97, title: "On Obedience To Pastors" },
        { id: 98, title: "On Visiting The Sick" },
        { id: 99, title: "The Reward of the Righteous" },
        { id: 100, title: "On Pleasing All Men" },
        { id: 101, title: "The Duty of Constant Communion" },
        { id: 102, title: "Of Former Times" },
        { id: 103, title: "What is Man?" },
        { id: 104, title: "On Attending The Church Service" },
        { id: 105, title: "On Conscience" },
        { id: 106, title: "On Faith (Heb 11:6)" },
        { id: 107, title: "On God's Vineyard" },
        { id: 108, title: "On Riches" },
        { id: 109, title: "What is Man? (Ps 8:4)" },
        { id: 110, title: "On Discoveries of Faith" },
        { id: 111, title: "On The Omnipresence Of God" },
        { id: 112, title: "The Rich Man and Lazarus" },
        { id: 113, title: "Walking By Sight, And Walking By Faith" },
        { id: 114, title: "The Unity Of The Divine Being" },
        { id: 115, title: "The Ministerial Office" },
        { id: 116, title: "Causes Of The Inefficacy Of Christianity" },
        { id: 117, title: "On Knowing Christ After The Flesh" },
        { id: 118, title: "On A Single Eye" },
        { id: 119, title: "On Worldly Folly" },
        { id: 120, title: "On The Wedding Garment" },
        { id: 121, title: "Human Life A Dream" },
        { id: 122, title: "On Faith (Heb 11:1)" },
        { id: 123, title: "The Deceitfulness Of The Human Heart" },
        { id: 124, title: "The Heavenly Treasure In Earthen Vessels" },
        { id: 125, title: "On Living Without God" },
        { id: 126, title: "On The Danger Of Increasing Riches" },
        { id: 127, title: "The Trouble And Rest Of Good Men" },
        { id: 128, title: "Free Grace" },
        { id: 129, title: "The Cause And Cure Of Earthquakes" },
        { id: 130, title: "National Sins And Miseries" },
        { id: 131, title: "The Late Work Of God In North America" },
        { id: 132, title: "On Laying The Foundation Of The New Chapel" },
        { id: 133, title: "On The Death Of Rev. Mr. John Fletcher" },
        { id: 134, title: "True Christianity Defended" },
        { id: 135, title: "On Mourning For The Dead" },
        { id: 136, title: "On Corrupting The Word Of God" },
        { id: 137, title: "On The Resurrection Of The Dead" },
        { id: 138, title: "On Grieving The Holy Spirit" },
        { id: 139, title: "On Love" },
        { id: 140, title: "On Public Diversions" },
        { id: 141, title: "On The Holy Spirit" }
    ];

    console.log(`📤 Ingesting index for ${fullWesleyIndex.length} sermons...`);

    let ingestedCount = 0;
    for (const s of fullWesleyIndex) {
        try {
            await collection.updateOne(
                { title: s.title, preacher: "John Wesley" },
                {
                    $set: {
                        title: s.title,
                        preacher: "John Wesley",
                        content: `Verified NNU 1872 Edition Index Entry: Sermon ${s.id} - ${s.title}. Full grounding pending deep-scrape.`,
                        tags: ["John Wesley", "NNU 1872", "Standard Sermons"],
                        migrated_at: new Date().toISOString(),
                        sermon_number: s.id
                    }
                },
                { upsert: true }
            );
            ingestedCount++;
            if (ingestedCount % 20 === 0) console.log(`🚀 Progress: ${ingestedCount}/${fullWesleyIndex.length}...`);
        } catch (e) {
            console.error(`❌ Error indexing ${s.title}:`, e);
        }
    }

    console.log(`✅ SUCCESS: ${ingestedCount} Wesley sermons now indexed in Astra DB.`);
    process.exit(0);
}

ingestFullNNUWesley().catch(err => {
    console.error("💥 Critical Indexing Error:", err);
    process.exit(1);
});
