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
    {
        ssr: false,
        loading: () => <NotebookSkeleton />,
    }
);

/**
 * SSR-visible skeleton that contains real text content for Googlebot.
 * When JS loads, it's replaced by the interactive NotebookCore.
 */
function NotebookSkeleton() {
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground">
            <div className="animate-spin text-4xl mb-4">✝️</div>
            <h1 className="text-xl font-bold tracking-widest uppercase">
                DailyMannaAI Notebook
            </h1>
            <p className="text-muted text-sm mt-2 max-w-md text-center">
                Your personal Bible study workspace — save verses, write notes,
                create highlights, and organize your spiritual journey.
            </p>
            <noscript>
                <div className="mt-8 max-w-lg text-center text-sm text-muted-foreground">
                    <h2 className="font-bold text-lg mb-2">Bible Study Notebook</h2>
                    <p>
                        DailyMannaAI Notebook lets you save and organize Bible
                        verses, write study notes, create color-coded highlights,
                        and build a personal devotional journal. Sign in to access
                        your notebook across devices.
                    </p>
                </div>
            </noscript>
        </div>
    );
}

export default function Page() {
    return <NotebookCore />;
}
