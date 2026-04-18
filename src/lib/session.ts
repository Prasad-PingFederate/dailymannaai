// src/lib/session.ts
// JWT creation and cookie-based sessions — NO NextAuth needed

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE_NAME = "dailymanna_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
    userId: string;
    email: string;
    name: string;
    plan: string;
}

export async function createToken(payload: SessionPayload): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, SECRET);
        return payload as unknown as SessionPayload;
    } catch {
        return null;
    }
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
    const token = await createToken(payload);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: MAX_AGE,
        path: "/",
    });
}

export async function getSession(): Promise<SessionPayload | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(COOKIE_NAME)?.value;
        if (!token) return null;
        return await verifyToken(token);
    } catch {
        return null;
    }
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
    try {
        const token = req.cookies.get(COOKIE_NAME)?.value;
        if (!token) return null;
        return await verifyToken(token);
    } catch {
        return null;
    }
}

export async function clearSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}
