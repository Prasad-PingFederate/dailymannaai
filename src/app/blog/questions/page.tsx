// src/app/blog/questions/page.tsx
// Public listing of all AI-generated spiritual questions with inline accordion answers

import type { Metadata } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";
import { Hash, ArrowLeft, Sparkles } from "lucide-react";
import QuestionsAccordion from "./QuestionsAccordion";

export const metadata: Metadata = {
    title: "Christian Spiritual Questions Answered — DailyManna AI",
    description:
        "Explore hundreds of high-volume Christian questions answered with Scripture and Holy Spirit insight. Find biblical answers to what believers ask most.",
    alternates: { canonical: "https://www.dailymannaai.com/blog/questions" },
    openGraph: {
        title: "Christian Spiritual Questions Answered — DailyManna AI",
        description:
            "Find biblical, Spirit-led answers to the spiritual questions millions of Christians ask every day.",
        url: "https://www.dailymannaai.com/blog/questions",
    },
};

export interface Question {
    slug: string;
    question: string;
    category: string;
    keywords: string[];
    searchVolume: "high" | "medium";
    createdAt: string;
    metaDescription: string;
    answer?: string;
    shortAnswer?: string;
    keyVerse?: string;
}

export const CATEGORY_META: Record<string, { label: string; color: string; emoji: string }> = {
    salvation:     { label: "Salvation",     color: "#6366f1", emoji: "🕊️" },
    prayer:        { label: "Prayer",        color: "#0ea5e9", emoji: "🙏" },
    healing:       { label: "Healing",       color: "#22c55e", emoji: "💚" },
    faith:         { label: "Faith",         color: "#f59e0b", emoji: "🌿" },
    prophecy:      { label: "Prophecy",      color: "#ef4444", emoji: "🔥" },
    relationships: { label: "Relationships", color: "#ec4899", emoji: "💛" },
    suffering:     { label: "Suffering",     color: "#8b5cf6", emoji: "🌧️" },
    "holy-spirit": { label: "Holy Spirit",   color: "#06b6d4", emoji: "🕊️" },
    church:        { label: "Church",        color: "#10b981", emoji: "⛪" },
    bible:         { label: "Bible",         color: "#f97316", emoji: "📖" },
    all:           { label: "General",       color: "#D4AF37", emoji: "✨" },
};

function readQuestions(): Question[] {
    try {
        const dataFile = path.join(process.cwd(), "src", "data", "spiritual-questions.json");
        if (!fs.existsSync(dataFile)) return [];
        return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
    } catch { return []; }
}

function groupByCategory(questions: Question[]): Record<string, Question[]> {
    const groups: Record<string, Question[]> = {};
    for (const q of questions) {
        const cat = q.category || "all";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(q);
    }
    return groups;
}

// Revalidate every 60 seconds to pick up newly generated answers
export const revalidate = 60;

export default function QuestionsIndexPage() {
    const questions = readQuestions();
    const grouped = groupByCategory(questions);
    const categories = Object.keys(grouped).sort();

    return (
        <div className="min-h-screen bg-white dark:bg-navy" style={{ fontFamily: "Inter, sans-serif" }}>

            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-2 to-[#0d0a21] px-6 py-20 text-center">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gold/10 rounded-full blur-[120px]" />
                </div>
                <div className="relative max-w-3xl mx-auto space-y-6">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-white/40 hover:text-white/80 text-xs font-black uppercase tracking-widest transition-colors"
                    >
                        <ArrowLeft size={11} /> Blog
                    </Link>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-[0.3em]">
                        <Hash size={11} />
                        {questions.length} Questions &amp; Answers
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none">
                        Spiritual Questions
                        <br />
                        <span className="text-gold">Answered by Scripture</span>
                    </h1>
                    <p className="text-white/50 text-base leading-relaxed max-w-md mx-auto">
                        Click the <strong className="text-gold">+</strong> button on any question to instantly see a short, Scripture-backed answer right here.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-16">
                {questions.length === 0 ? (
                    <div className="text-center py-24 space-y-6">
                        <div className="mx-auto w-20 h-20 rounded-[2rem] bg-gold/10 border border-gold/20 flex items-center justify-center">
                            <Hash size={32} className="text-gold" />
                        </div>
                        <h2 className="text-navy dark:text-white font-black text-2xl">No Questions Yet</h2>
                        <p className="text-slate-500 dark:text-white/40 text-sm max-w-sm mx-auto">
                            Use the AI generator to create your spiritual question library.
                        </p>
                        <Link
                            href="/blog/generate"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-navy text-xs font-black uppercase tracking-widest hover:bg-gold/90 transition-all"
                        >
                            <Sparkles size={12} /> Generate Questions
                        </Link>
                    </div>
                ) : (
                    <QuestionsAccordion
                        questions={questions}
                        grouped={grouped}
                        categories={categories}
                        categoryMeta={CATEGORY_META}
                    />
                )}
            </div>
        </div>
    );
}
