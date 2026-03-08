// src/app/api/auth/debug/route.ts
// TEMPORARY DEBUG ENDPOINT — remove after fixing

import { NextResponse } from "next/server";

export async function GET() {
    const results: Record<string, string> = {};

    // 1. Check env vars
    results["JWT_SECRET"] = process.env.JWT_SECRET ? `✅ Set (length: ${process.env.JWT_SECRET.length})` : "❌ MISSING";
    results["ASTRA_DB_ID"] = process.env.ASTRA_DB_ID ? `✅ ${process.env.ASTRA_DB_ID}` : "❌ MISSING";
    results["ASTRA_DB_REGION"] = process.env.ASTRA_DB_REGION ? `✅ ${process.env.ASTRA_DB_REGION}` : "❌ MISSING";
    results["ASTRA_DB_TOKEN"] = process.env.ASTRA_DB_TOKEN ? `✅ Set (starts with: ${process.env.ASTRA_DB_TOKEN.substring(0, 10)}...)` : "❌ MISSING";
    results["ASTRA_KEYSPACE"] = process.env.ASTRA_KEYSPACE ? `✅ ${process.env.ASTRA_KEYSPACE}` : "❌ MISSING — will use default_keyspace";
    results["ASTRA_DB_NAMESPACE"] = process.env.ASTRA_DB_NAMESPACE ? `✅ ${process.env.ASTRA_DB_NAMESPACE}` : "❌ Not set";

    // 2. Build the URL our code would use
    const keyspace = process.env.ASTRA_KEYSPACE || process.env.ASTRA_DB_NAMESPACE || "default_keyspace";
    const BASE = `https://${process.env.ASTRA_DB_ID}-${process.env.ASTRA_DB_REGION}.apps.astra.datastax.com/api/rest/v2/keyspaces/${keyspace}`;
    results["ASTRA_URL"] = BASE;

    // 3. Test actual AstraDB connection to users table
    try {
        const res = await fetch(`${BASE}/users?where={"email":{"$eq":"test@test.com"}}`, {
            headers: {
                "X-Cassandra-Token": process.env.ASTRA_DB_TOKEN!,
                "Content-Type": "application/json",
            },
        });
        const text = await res.text();
        results["ASTRA_CONNECTION"] = res.ok
            ? `✅ Connected! Status: ${res.status}`
            : `❌ Failed! Status: ${res.status} — Response: ${text.substring(0, 200)}`;
    } catch (err: any) {
        results["ASTRA_CONNECTION"] = `❌ Exception: ${err.message}`;
    }

    // 4. Test JWT signing
    try {
        const { SignJWT } = await import("jose");
        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
        await new SignJWT({ test: true })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("1m")
            .sign(secret);
        results["JWT_SIGNING"] = "✅ JWT signing works!";
    } catch (err: any) {
        results["JWT_SIGNING"] = `❌ JWT signing failed: ${err.message}`;
    }

    return NextResponse.json(results, { status: 200 });
}
