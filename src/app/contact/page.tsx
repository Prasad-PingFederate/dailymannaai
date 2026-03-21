import type { Metadata } from "next";
import ContactPageClient from "./ContactPageClient";

export const metadata: Metadata = {
    title: "Contact Us — DailyMannaAI | Get in Touch",
    description:
        "Have a question, feedback, or prayer request? Contact the DailyMannaAI team. We typically respond within 24–48 hours.",
    keywords: [
        "contact DailyMannaAI", "Bible study support", "prayer request",
        "Christian app support", "feedback",
    ],
    openGraph: {
        title: "Contact Us — DailyMannaAI",
        description: "Have a question, feedback, or prayer request? Get in touch with DailyMannaAI.",
        url: "https://www.dailymannaai.com/contact",
        siteName: "DailyMannaAI",
        type: "website",
    },
    twitter: {
        card: "summary",
        title: "Contact Us — DailyMannaAI",
        description: "Get in touch with the DailyMannaAI team.",
    },
    alternates: {
        canonical: "https://www.dailymannaai.com/contact",
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

export default function ContactPage() {
    return <ContactPageClient />;
}
