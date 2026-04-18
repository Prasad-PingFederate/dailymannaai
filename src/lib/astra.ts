import { DataAPIClient } from "@datastax/astra-db-ts";

let client: DataAPIClient | null = null;
let db: any = null;

function initClient() {
    if (client) return;

    const {
        ASTRA_DB_APPLICATION_TOKEN,
        ASTRA_DB_API_ENDPOINT,
        ASTRA_DB_NAMESPACE
    } = process.env;

    if (!ASTRA_DB_APPLICATION_TOKEN || !ASTRA_DB_API_ENDPOINT) {
        throw new Error("❌ Astra DB credentials missing in process.env. Ensure .env.local is loaded.");
    }

    client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
    db = client.db(ASTRA_DB_API_ENDPOINT, {
        keyspace: ASTRA_DB_NAMESPACE || "default_keyspace"
    });
}

export function getAstraDb() {
    initClient();
    return db;
}

export async function getCollection(collectionName: string) {
    initClient();
    return db.collection(collectionName);
}
