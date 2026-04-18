// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail, updateLastLogin } from "@/lib/astra-auth";
import { setSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password)
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });

        const user = await getUserByEmail(email);
        if (!user)
            return NextResponse.json({ error: "No account found with this email" }, { status: 401 });

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match)
            return NextResponse.json({ error: "Incorrect password. Please try again." }, { status: 401 });

        await updateLastLogin(user.id);

        await setSessionCookie({
            userId: user.id,
            email: user.email,
            name: user.name,
            plan: user.plan,
        });

        return NextResponse.json({ success: true, name: user.name });

    } catch (err) {
        console.error("Login error:", err);
        return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
    }
}
