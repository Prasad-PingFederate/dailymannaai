import nodemailer from "nodemailer";

interface SendEmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

export async function sendEmail(options: SendEmailOptions) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("SMTP_USER or SMTP_PASS is missing in environment variables.");
        // We do not throw an error in development so we can see the OTP in logs
        if (process.env.NODE_ENV !== "production") {
            console.log("\n====== MOCK EMAIL ======");
            console.log(`To: ${options.to}`);
            console.log(`Subject: ${options.subject}`);
            console.log(`Text: ${options.text}`);
            console.log("========================\n");
            return;
        }
        throw new Error("Email configuration missing.");
    }

    const transporter = nodemailer.createTransport({
        service: "gmail", // easy configuration for gmail
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS, // This should be an App Password, not main password
        },
    });

    try {
        await transporter.sendMail({
            from: `"DailyMannaAI" <${process.env.SMTP_USER}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        });
        console.log(`Email sent to ${options.to}`);
    } catch (err) {
        console.error("Failed to send email:", err);
        throw err;
    }
}
