// src/lib/ai/bible-explorer-db.ts
import { DataAPIClient } from "@datastax/astra-db-ts";

let dbInstance: any = null;

export function getAstraDb() {
    if (dbInstance) return dbInstance;

    const token = process.env.ASTRA_DB_APPLICATION_TOKEN || process.env.ASTRA_DB_TOKEN;
    const endpoint = process.env.ASTRA_DB_API_ENDPOINT || process.env.ASTRA_DB_ENDPOINT;

    // Use placeholder values during build if env vars are missing
    const client = new DataAPIClient(token || "placeholder_token");
    dbInstance = client.db(endpoint || "https://placeholder.astra.datastax.com", {
        keyspace: "default_keyspace"
    });
    return dbInstance;
}

// Always use getAstraDb() to avoid top-level crashes

export async function testAstraDbConnection() {
    const token = process.env.ASTRA_DB_APPLICATION_TOKEN || process.env.ASTRA_DB_TOKEN;
    const endpoint = process.env.ASTRA_DB_API_ENDPOINT || process.env.ASTRA_DB_ENDPOINT;

    if (!token || !endpoint) {
        console.warn("AstraDB credentials missing.");
        return false;
    }
    try {
        const db = getAstraDb();
        const colls = await db.listCollections();
        console.log("Connected to AstraDB:", colls);
        return true;
    } catch (error) {
        console.error("Failed to connect to AstraDB:", error);
        return false;
    }
}
