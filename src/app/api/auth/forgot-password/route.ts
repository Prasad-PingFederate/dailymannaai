import { NextResponse } from "next/server";
import { getUserByEmail, saveOTP } from "@/lib/astra-auth";
import { sendEmail } from "@/lib/email";

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
}

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const user = await getUserByEmail(email);

        // We always return 200 even if user not found, 
        // to prevent email enumeration attacks
        if (user) {
            const otp = generateOTP();
            // Expires in 15 minutes
            const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

            await saveOTP(email, otp, expires);

            const emailText = `Hello ${user.name},\n\nSomeone requested a password reset for your DailyMannaAI account.\n\nYour 6-digit verification code is: ${otp}\n\nThis code will expire in 15 minutes.\n\nIf you did not request this, please ignore this email.`;

            await sendEmail({
                to: email,
                subject: "Reset your DailyMannaAI Password",
                text: emailText,
            });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Forgot Password Error:", err);
        return NextResponse.json(
            { error: "An error occurred while processing your request." },
            { status: 500 }
        );
    }
}
