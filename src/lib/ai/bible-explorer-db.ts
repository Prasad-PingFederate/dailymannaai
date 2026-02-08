// src/lib/ai/bible-explorer-db.ts
import { DataAPIClient } from "@datastax/astra-db-ts";

// Initialize the client
const token = process.env.ASTRA_DB_APPLICATION_TOKEN || process.env.ASTRA_DB_TOKEN;
const endpoint = process.env.ASTRA_DB_API_ENDPOINT || process.env.ASTRA_DB_ENDPOINT;

const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN as string);
const db = client.db(process.env.ASTRA_DB_API_ENDPOINT as string, {
    keyspace: "default_keyspace"
});

export const astraDb = db;

export async function testAstraDbConnection() {
    if (!token || !endpoint) {
        console.warn("AstraDB credentials missing.");
        return false;
    }
    try {
        const colls = await db.listCollections();
        console.log("Connected to AstraDB:", colls);
        return true;
    } catch (error) {
        console.error("Failed to connect to AstraDB:", error);
        return false;
    }
}
