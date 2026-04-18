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

    // Support both naming conventions
    const token =
        process.env.ASTRA_DB_TOKEN ||
        process.env.ASTRA_DB_APPLICATION_TOKEN;

    const endpoint =
        process.env.ASTRA_DB_API_ENDPOINT ||
        process.env.ASTRA_DB_ENDPOINT;

    const keyspace =
        process.env.ASTRA_DB_NAMESPACE ||
        process.env.ASTRA_DB_KEYSPACE ||
        "default_keyspace";

    if (!token || !endpoint) {
        console.error("❌ [AstraDB] Env vars found:", {
            ASTRA_DB_TOKEN: !!process.env.ASTRA_DB_TOKEN,
            ASTRA_DB_APPLICATION_TOKEN: !!process.env.ASTRA_DB_APPLICATION_TOKEN,
            ASTRA_DB_API_ENDPOINT: !!process.env.ASTRA_DB_API_ENDPOINT,
        });
        throw new Error("ASTRA_DB_CREDENTIALS_MISSING");
    }

    try {
        const client = new DataAPIClient(token);
        // Use 'keyspace' as 'namespace' is deprecated in newer SDK versions
        const db = client.db(endpoint, { keyspace } as any);
        cachedAstraDb = db;
        console.log("✅ [AstraDB] Connected successfully. Keyspace:", keyspace);
        return db;
    } catch (error: any) {
        console.error(`❌ [AstraDB] Connection failed: ${error.message}`);
        throw error;
    }
}
