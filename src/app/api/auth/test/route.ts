import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/astra-auth";

export async function GET() {
    try {
        const user = await getUserByEmail("prasad.dammai94@gmail.com");
        return NextResponse.json({ user });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
