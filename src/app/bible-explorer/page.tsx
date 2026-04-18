// src/app/bible-explorer/page.tsx
import type { Metadata } from "next";
import BibleExplorer from '@/components/bible-explorer/BibleExplorer';

export const metadata: Metadata = {
    title: "Bible Explorer — DailyMannaAI | Read & Compare 200+ Bible Translations",
    description:
        "Explore the Bible in 200+ languages and translations. Read, compare, and study Scripture with DailyMannaAI's intelligent Bible Explorer featuring Old & New Testament.",
    keywords: [
        "Bible explorer", "online Bible", "Bible translations", "read Bible online",
        "compare Bible versions", "multilingual Bible", "scripture study", "DailyMannaAI",
    ],
    openGraph: {
        title: "Bible Explorer — DailyMannaAI | 200+ Bible Translations",
        description: "Explore the Bible in 200+ languages. Read, compare, and study Scripture online.",
        url: "https://www.dailymannaai.com/bible-explorer",
        siteName: "DailyMannaAI",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Bible Explorer — DailyMannaAI",
        description: "Read & compare the Bible in 200+ translations.",
    },
    alternates: {
        canonical: "https://www.dailymannaai.com/bible-explorer",
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

type Props = {
    searchParams?: Promise<{ lang?: string; v?: string; book?: string }>;
};

export default async function BibleExplorerPage({ searchParams }: Props) {
    const params = await searchParams;
    const initialTranslation = params?.v || params?.lang || null;
    const initialBookSlug = params?.book || null;

    return (
        <main className="h-screen w-screen overflow-hidden">
             <BibleExplorer initialTranslation={initialTranslation} initialBookSlug={initialBookSlug} />
        </main>
    );
}
