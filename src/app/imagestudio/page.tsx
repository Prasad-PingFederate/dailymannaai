import type { Metadata } from "next";
import BibleQuoteGenerator from "@/components/notebook/BibleQuoteGenerator";

export const metadata: Metadata = {
    title: "Image Studio — DailyMannaAI | Create Scripture-Inspired Art",
    description: "Generate beautiful, faith-inspired images from Bible verses. Share the Word through stunning AI-generated art with DailyMannaAI Image Studio.",
    keywords: ["Bible art", "Scripture images", "AI Bible art", "Christian image generator", "DailyMannaAI", "Image Studio"],
    openGraph: {
        title: "Image Studio — DailyMannaAI",
        description: "Create and share beautiful scripture-inspired art.",
        type: "website",
        url: "https://www.dailymannaai.com/imagestudio",
    }
};

export default function ImageStudioPage() {
    return (
        <main className="min-h-screen bg-white">
            <BibleQuoteGenerator />
        </main>
    );
}
