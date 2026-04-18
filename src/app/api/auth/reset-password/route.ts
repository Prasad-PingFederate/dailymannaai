import { NextResponse } from "next/server";
import { getUserByEmail, updatePassword, clearOTP } from "@/lib/astra-auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { email, otp, newPassword } = await req.json();

        if (!email || !otp || !newPassword) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const user = await getUserByEmail(email);

        if (!user || !user.avatar_url) {
            return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 400 });
        }

        let otpData;
        try {
            otpData = JSON.parse(user.avatar_url);
        } catch {
            return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 400 });
        }

        if (!otpData.otp || !otpData.exp) {
            return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 400 });
        }

        // Check if OTP matches
        if (otpData.otp !== otp) {
            return NextResponse.json({ error: "Incorrect verification code." }, { status: 400 });
        }

        // Check if OTP is expired
        const now = new Date();
        const expiresAt = new Date(otpData.exp);
        if (now > expiresAt) {
            await clearOTP(email); // Clean up expired OTP
            return NextResponse.json({ error: "Verification code has expired. Please request a new one." }, { status: 400 });
        }

        // If we get here, OTP is valid!
        // Hash the new password
        const password_hash = await bcrypt.hash(newPassword, 12);

        // Update password in AstraDB (this helper also unsets the OTP fields automatically)
        await updatePassword(email, password_hash);

        return NextResponse.json({ success: true, message: "Password updated successfully!" });

    } catch (err: any) {
        console.error("Reset Password Error:", err);
        return NextResponse.json(
            { error: "An error occurred while resetting your password." },
            { status: 500 }
        );
    }
}
