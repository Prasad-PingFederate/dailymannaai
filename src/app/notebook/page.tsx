import type { Metadata } from "next";
import dynamic from "next/dynamic";

// ── SEO Metadata (rendered server-side for Google) ──
export const metadata: Metadata = {
    title: "Notebook — DailyMannaAI | Bible Study Notes & Highlights",
    description:
        "Your personal Bible study workspace. Save verses, write notes, create highlights, and organize your spiritual journey with DailyMannaAI's intelligent notebook.",
    keywords: [
        "Bible study notes",
        "verse highlights",
        "daily devotional journal",
        "Christian notebook",
        "scripture study",
        "DailyMannaAI",
    ],
    openGraph: {
        title: "Notebook — DailyMannaAI | Bible Study Notes & Highlights",
        description:
            "Your personal Bible study workspace. Save verses, write notes, and organize your spiritual journey.",
        url: "https://www.dailymannaai.com/notebook",
        siteName: "DailyMannaAI",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Notebook — DailyMannaAI",
        description:
            "Your personal Bible study workspace on DailyMannaAI.",
    },
    alternates: {
        canonical: "https://www.dailymannaai.com/notebook",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true },
    },
};

// CRITICAL: Load with SSR: FALSE (pdfjs-dist / canvas errors in build)
const NotebookCore = dynamic(
    () => import("@/components/notebook/NotebookCore"),
    { ssr: false }
);

export default function Page() {
    return <NotebookCore />;
}
