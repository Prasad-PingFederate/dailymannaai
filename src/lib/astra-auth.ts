import { getDatabase as getAstraDb } from "./mongodb";
async function getCollection(name: string) { const db = await getAstraDb(); return db.collection(name); }
import { randomUUID } from "crypto";

export interface DBUser {
    _id?: string;
    id: string;
    email: string;
    name: string;
    password_hash: string;
    avatar_url: string;
    plan: string;
    created_at: string;
    last_login: string;
    otp_code?: string;
    otp_expires?: string;
}

// Helper to ensure collection exists
async function ensureUsersCollection() {
    const db = getAstraDb();
    try {
        const collections = await db.listCollections();
        const exists = collections.find((c: any) => c.name === "users" || c === "users");
        if (!exists) {
            console.log("Creating 'users' collection in AstraDB Data API...");
            await db.createCollection("users");
        }
    } catch (err) {
        console.warn("Could not check/create users collection. Maybe it already exists?", err);
    }
}

export async function getUserByEmail(email: string): Promise<DBUser | null> {
    try {
        await ensureUsersCollection();
        const collection = await getCollection("users");
        const user = await collection.findOne({ email: email.toLowerCase() });
        return user as DBUser | null;
    } catch (err) {
        console.error("getUserByEmail Error:", err);
        return null;
    }
}

export async function getUserById(id: string): Promise<DBUser | null> {
    try {
        await ensureUsersCollection();
        const collection = await getCollection("users");
        const user = await collection.findOne({ id });
        return user as DBUser | null;
    } catch { return null; }
}

export async function createUser(data: {
    name: string; email: string; password_hash: string;
}): Promise<{ success: boolean; error?: string; user?: DBUser }> {
    try {
        await ensureUsersCollection();
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

        const collection = await getCollection("users");
        await collection.insertOne(user);

        return { success: true, user };
    } catch (err) {
        console.error("createUser Error:", err);
        return { success: false, error: "Server error." };
    }
}

export async function updateLastLogin(id: string): Promise<void> {
    try {
        const collection = await getCollection("users");
        await collection.updateOne({ id }, { $set: { last_login: new Date().toISOString() } });
    } catch { }
}

export async function saveOTP(email: string, otpCode: string, expiresISO: string): Promise<void> {
    try {
        const collection = await getCollection("users");
        const user = await getUserByEmail(email);
        if (user && user.id) {
            // Because users is a strict CQL mapped table, custom columns like otp_code 
            // will be ignored by Data API. We'll securely stash it in the unused avatar_url field.
            const otpPayload = JSON.stringify({ otp: otpCode, exp: expiresISO });
            await collection.updateOne(
                { id: user.id },
                { $set: { avatar_url: otpPayload } }
            );
        }
    } catch (err) {
        console.error("saveOTP Error:", err);
    }
}

export async function clearOTP(email: string): Promise<void> {
    try {
        const collection = await getCollection("users");
        const user = await getUserByEmail(email);
        if (user && user.id) {
            await collection.updateOne(
                { id: user.id },
                { $set: { avatar_url: "" } } // Clear it out
            );
        }
    } catch (err) {
        console.error("clearOTP Error:", err);
    }
}

export async function updatePassword(email: string, newPasswordHash: string): Promise<void> {
    try {
        const collection = await getCollection("users");
        const user = await getUserByEmail(email);
        if (user && user.id) {
            await collection.updateOne(
                { id: user.id },
                { $set: { password_hash: newPasswordHash, avatar_url: "" } }
            );
        }
    } catch (err) {
        console.error("updatePassword Error:", err);
    }
}
