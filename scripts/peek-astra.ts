// scripts/peek-astra.ts
import { getAstraDb } from "../src/lib/astra";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function peek() {
    try {
        const db = getAstraDb();
        const collections = ["bible_kjv", "bible_niv", "bible_esv"];
        
        for (const name of collections) {
            console.log(`--- Collection: ${name} ---`);
            const col = db.collection(name);
            const doc = await col.findOne({});
            if (doc) {
                console.log(JSON.stringify(doc, null, 2));
            } else {
                console.log("No documents found.");
            }
        }
    } catch (error) {
        console.error("Error peeking into Astra:", error);
    }
}

peek();
