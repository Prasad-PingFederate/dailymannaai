// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser } from "@/lib/astra-auth";
import { setSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json();

        if (!name?.trim())
            return NextResponse.json({ error: "Name is required" }, { status: 400 });

        if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return NextResponse.json({ error: "Valid email is required" }, { status: 400 });

        if (!password || password.length < 8)
            return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

        const password_hash = await bcrypt.hash(password, 12);
        const result = await createUser({ name, email, password_hash });

        if (!result.success)
            return NextResponse.json({ error: result.error }, { status: 400 });

        await setSessionCookie({
            userId: result.user!.id,
            email: result.user!.email,
            name: result.user!.name,
            plan: result.user!.plan,
        });

        return NextResponse.json({ success: true, name: result.user!.name });

    } catch (err) {
        console.error("Register error:", err);
        return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
    }
}
