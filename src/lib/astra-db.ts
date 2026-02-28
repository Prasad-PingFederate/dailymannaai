// src/lib/astra-db.ts
import { DataAPIClient, Db } from "@datastax/astra-db-ts";

let cachedAstraDb: Db | null = null;

/**
 * Connects to DataStax Astra DB using the Data API.
 * Requires ASTRA_DB_TOKEN and ASTRA_DB_API_ENDPOINT in .env.
 */
export async function getAstraDatabase(): Promise<Db> {
    if (cachedAstraDb) {
        return cachedAstraDb;
    }

    const token = process.env.ASTRA_DB_TOKEN;
    const endpoint = process.env.ASTRA_DB_API_ENDPOINT;

    if (!token || !endpoint) {
        console.warn("⚠️ [AstraDB] Missing ASTRA_DB_TOKEN or ASTRA_DB_API_ENDPOINT. Skipping Astra initialization.");
        throw new Error("ASTRA_DB_CREDENTIALS_MISSING");
    }

    try {
        const client = new DataAPIClient(token);
        const db = client.db(endpoint);

        cachedAstraDb = db;
        console.log("✅ [AstraDB] Successfully connected to Global Christian Index (Astra DB).");
        return db;
    } catch (error: any) {
        console.error(`❌ [AstraDB] Connection failed: ${error.message}`);
        throw error;
    }
}
