import { config } from "dotenv";
config({ path: ".env.local" });

import { DataAPIClient } from "@datastax/astra-db-ts";

async function run() {
    const {
        ASTRA_DB_APPLICATION_TOKEN,
        ASTRA_DB_API_ENDPOINT,
        ASTRA_DB_NAMESPACE
    } = process.env;

    const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
    const db = client.db(ASTRA_DB_API_ENDPOINT!, {
        keyspace: ASTRA_DB_NAMESPACE || "default_keyspace"
    });

    const col = db.collection("users");
    const user = await col.findOne({ email: "prasad.dammai94@gmail.com" });
    console.log("USER:", user);
}

run().catch(console.error);
