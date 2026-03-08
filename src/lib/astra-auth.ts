// src/lib/astra-auth.ts
import { randomUUID } from "crypto";

const BASE = `https://${process.env.ASTRA_DB_ID}-${process.env.ASTRA_DB_REGION}.apps.astra.datastax.com/api/rest/v2/keyspaces/${process.env.ASTRA_KEYSPACE}`;
const TABLE = "users";
const headers = {
    "X-Cassandra-Token": process.env.ASTRA_DB_TOKEN!,
    "Content-Type": "application/json",
};

export interface DBUser {
    id: string;
    email: string;
    name: string;
    password_hash: string;
    avatar_url: string;
    plan: string;
    created_at: string;
    last_login: string;
}

export async function getUserByEmail(email: string): Promise<DBUser | null> {
    try {
        const res = await fetch(
            `${BASE}/${TABLE}?where={"email":{"$eq":"${email.toLowerCase()}"}}`,
            { headers }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data.data?.[0] ?? null;
    } catch { return null; }
}

export async function getUserById(id: string): Promise<DBUser | null> {
    try {
        const res = await fetch(`${BASE}/${TABLE}/${id}`, { headers });
        if (!res.ok) return null;
        const data = await res.json();
        return data.data?.[0] ?? null;
    } catch { return null; }
}

export async function createUser(data: {
    name: string; email: string; password_hash: string;
}): Promise<{ success: boolean; error?: string; user?: DBUser }> {
    try {
        const existing = await getUserByEmail(data.email);
        if (existing) return { success: false, error: "Email already registered. Please sign in." };

        const user: DBUser = {
            id: randomUUID(),
            email: data.email.toLowerCase().trim(),
            name: data.name.trim(),
            password_hash: data.password_hash,
            avatar_url: "",
            plan: "free",
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
        };

        const res = await fetch(`${BASE}/${TABLE}`, {
            method: "POST", headers, body: JSON.stringify(user),
        });

        return res.ok
            ? { success: true, user }
            : { success: false, error: "Failed to create account." };
    } catch { return { success: false, error: "Server error." }; }
}

export async function updateLastLogin(id: string): Promise<void> {
    try {
        await fetch(`${BASE}/${TABLE}/${id}`, {
            method: "PATCH", headers,
            body: JSON.stringify({ last_login: new Date().toISOString() }),
        });
    } catch { }
}
