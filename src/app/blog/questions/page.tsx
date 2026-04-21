// src/app/blog/questions/page.tsx
// Public listing of all AI-generated spiritual questions

import type { Metadata } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";
import { ChevronRight, BookOpen, Hash, Sparkles, ArrowLeft } from "lucide-react";

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

interface Question {
    slug: string;
    question: string;
    category: string;
    keywords: string[];
    searchVolume: "high" | "medium";
    createdAt: string;
    metaDescription: string;
    answer?: string;
}

const CATEGORY_META: Record<string, { label: string; color: string; emoji: string }> = {
    salvation: { label: "Salvation", color: "#6366f1", emoji: "🕊️" },
    prayer: { label: "Prayer", color: "#0ea5e9", emoji: "🙏" },
    healing: { label: "Healing", color: "#22c55e", emoji: "💚" },
    faith: { label: "Faith", color: "#f59e0b", emoji: "🌿" },
    prophecy: { label: "Prophecy", color: "#ef4444", emoji: "🔥" },
    relationships: { label: "Relationships", color: "#ec4899", emoji: "💛" },
    suffering: { label: "Suffering", color: "#8b5cf6", emoji: "🌧️" },
    "holy-spirit": { label: "Holy Spirit", color: "#06b6d4", emoji: "🕊️" },
    church: { label: "Church", color: "#10b981", emoji: "⛪" },
    bible: { label: "Bible", color: "#f97316", emoji: "📖" },
    all: { label: "General", color: "#D4AF37", emoji: "✨" },
};

function readQuestions(): Question[] {
    try {
        const dataFile = path.join(process.cwd(), "src", "data", "spiritual-questions.json");
        if (!fs.existsSync(dataFile)) return [];
        return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
    } catch {
        return [];
    }
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
                    <p className="text-white/50 text-lg font-serif italic max-w-xl mx-auto leading-relaxed">
                        &ldquo;Ask, and it shall be given you; seek, and ye shall find.&rdquo; — Matthew 7:7
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 py-16 space-y-16">

                {questions.length === 0 ? (
                    /* Empty state */
                    <div className="text-center py-24 space-y-6">
                        <div className="mx-auto w-20 h-20 rounded-[2rem] bg-gold/10 border border-gold/20 flex items-center justify-center">
                            <BookOpen size={32} className="text-gold" />
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
                    /* Category sections */
                    categories.map((cat) => {
                        const meta = CATEGORY_META[cat] || CATEGORY_META["all"];
                        const catQuestions = grouped[cat];
                        return (
                            <section key={cat} className="space-y-6">
                                {/* Category header */}
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                                        style={{ background: `${meta.color}20`, border: `1px solid ${meta.color}30` }}
                                    >
                                        {meta.emoji}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-navy dark:text-white uppercase tracking-wider">
                                            {meta.label}
                                        </h2>
                                        <p className="text-[10px] text-slate-400 dark:text-white/30 font-medium">
                                            {catQuestions.length} questions
                                        </p>
                                    </div>
                                    <div className="h-px flex-1 bg-slate-100 dark:bg-white/5 ml-2" />
                                </div>

                                {/* Question list */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {catQuestions.map((q) => (
                                        <Link
                                            key={q.slug}
                                            href={`/blog/questions/${q.slug}`}
                                            className="group flex items-start gap-3 p-5 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-gold/30 dark:hover:border-gold/20 hover:bg-gold/5 dark:hover:bg-gold/5 transition-all duration-200"
                                        >
                                            <div
                                                className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2"
                                                style={{ background: meta.color }}
                                            />
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <span className="text-navy dark:text-white font-semibold text-sm leading-snug group-hover:text-gold transition-colors block">
                                                    {q.question}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                            q.searchVolume === "high"
                                                                ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                                                                : "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                                                        }`}
                                                    >
                                                        {q.searchVolume} volume
                                                    </span>
                                                    {q.answer && (
                                                        <span className="text-[9px] text-gold font-black uppercase tracking-wider">
                                                            ✓ Answered
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight
                                                size={14}
                                                className="flex-shrink-0 text-slate-300 dark:text-white/20 group-hover:text-gold mt-0.5 transition-colors"
                                            />
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        );
                    })
                )}

                {/* Generate More CTA */}
                {questions.length > 0 && (
                    <div className="border-t border-slate-100 dark:border-white/5 pt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-slate-500 dark:text-white/40 text-sm">
                            {questions.length} questions total &mdash; grow your library with AI
                        </p>
                        <Link
                            href="/blog/generate"
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-navy dark:bg-gold text-white dark:text-navy text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all"
                        >
                            <Sparkles size={12} /> Generate More Questions
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
