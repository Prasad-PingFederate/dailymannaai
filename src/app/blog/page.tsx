// src/app/blog/page.tsx
// Main Blog Page - Spiritual Questions & Answers Hub

import type { Metadata } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";
import { Sparkles, Hash, Book, ArrowLeft } from "lucide-react";
import QuestionsAccordion from "@/components/blog/QuestionsAccordion";

export const metadata: Metadata = {
    title: "Christian Blog — Spiritual Questions & Bible Answers | DailyManna AI",
    description:
        "Find biblical answers to high-volume spiritual questions. Explore our Spirit-led Q&A library on faith, prayer, healing, and salvation.",
    alternates: { canonical: "https://www.dailymannaai.com/blog" },
};

import { Question, CATEGORY_META } from "./types";

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

// Revalidate every 60 seconds
export const revalidate = 60;

export default function BlogPage() {
    const questions = readQuestions();
    const grouped = groupByCategory(questions);
    const categories = Object.keys(grouped).sort();

    return (
        <div className="min-h-screen bg-white dark:bg-navy" style={{ fontFamily: "Inter, sans-serif" }}>
            {/* Minimal Nav */}
            <nav className="h-16 px-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-navy/80 backdrop-blur-md z-50">
                <Link href="/" className="font-black text-lg tracking-tighter text-navy dark:text-white">
                    DAILY<span className="text-gold">MANNA</span>AI
                </Link>
                <div className="flex items-center gap-6">
                    <Link href="/" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-gold transition-colors">Search</Link>
                    <Link href="/bible-explorer" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-gold transition-colors">Bible</Link>
                    <Link href="/notebook" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-gold transition-colors">Notebook</Link>
                    <Link href="/about" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-gold transition-colors">About</Link>
                </div>
            </nav>
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-2 to-[#0d0a21] py-20 px-6 text-center">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[600px] bg-gold/10 rounded-full blur-[120px]" />
                </div>
                <div className="relative max-w-3xl mx-auto space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-black uppercase tracking-[0.3em]">
                        <Sparkles size={12} />
                        Spiritual Q&amp;A Library
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight leading-none">
                        Christian Blog
                    </h1>
                    <p className="text-white/60 text-lg font-serif italic max-w-xl mx-auto">
                        &ldquo;Thy word is a lamp unto my feet, and a light unto my path.&rdquo; — Psalm 119:105
                    </p>
                    <div className="pt-4 flex items-center justify-center gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-black text-gold">{questions.length}</div>
                            <div className="text-[10px] text-white/40 uppercase tracking-widest">Questions</div>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="text-center">
                            <div className="text-2xl font-black text-gold">Scripture</div>
                            <div className="text-[10px] text-white/40 uppercase tracking-widest">Grounded</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-16 space-y-16">
                
                {/* Main Q&A Section */}
                <section className="space-y-10">
                    <div className="flex items-center gap-3">
                        <Hash size={16} className="text-gold" />
                        <h2 className="text-base font-black text-navy dark:text-white uppercase tracking-[0.2em]">Spiritual Questions</h2>
                        <div className="h-px flex-1 bg-slate-100 dark:bg-white/5" />
                    </div>

                    {questions.length === 0 ? (
                         <div className="text-center py-24 space-y-6">
                            <div className="mx-auto w-20 h-20 rounded-[2rem] bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
                                <Sparkles size={32} />
                            </div>
                            <h3 className="text-navy dark:text-white font-black text-2xl">Library is Empty</h3>
                            <Link
                                href="/blog/generate"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-navy text-xs font-black uppercase tracking-widest hover:bg-gold/90 transition-all font-bold"
                            >
                                Generate Questions Now
                            </Link>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto">
                            <QuestionsAccordion
                                questions={questions}
                                grouped={grouped}
                                categories={categories}
                                categoryMeta={CATEGORY_META}
                            />
                        </div>
                    )}
                </section>

                {/* Static/Featured Section (Optional) */}
                <section className="space-y-10 pt-10 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <Book size={16} className="text-gold" />
                        <h2 className="text-base font-black text-navy dark:text-white uppercase tracking-[0.2em]">Featured Research</h2>
                        <div className="h-px flex-1 bg-slate-100 dark:bg-white/5" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Link
                            href="/blog/how-to-hear-from-god"
                            className="group block rounded-[2rem] bg-slate-50 dark:bg-navy-2 border border-slate-100 dark:border-white/5 hover:border-gold/30 p-8 transition-all duration-300"
                        >
                            <h4 className="text-navy dark:text-white font-black text-lg mb-2 group-hover:text-gold transition-colors">
                                How to Hear from God: A Biblical Guide
                            </h4>
                            <p className="text-slate-500 dark:text-white/50 text-sm leading-relaxed">
                                Discover practical, biblical steps to tune your spirit and hear God's voice clearly.
                            </p>
                        </Link>
                        <Link
                            href="/blog/bible-verses-about-healing"
                            className="group block rounded-[2rem] bg-slate-50 dark:bg-navy-2 border border-slate-100 dark:border-white/5 hover:border-gold/30 p-8 transition-all duration-300"
                        >
                            <h4 className="text-navy dark:text-white font-black text-lg mb-2 group-hover:text-gold transition-colors">
                                Bible Verses About Healing
                            </h4>
                            <p className="text-slate-500 dark:text-white/50 text-sm leading-relaxed">
                                Powerful KJV Bible verses about healing for body, mind, and spirit.
                            </p>
                        </Link>
                    </div>
                </section>

                {/* Admin Link (Bottom) */}
                <div className="text-center pt-10">
                    <Link
                        href="/blog/generate"
                        className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-slate-400 hover:text-gold transition-colors"
                    >
                        <Sparkles size={12} />
                        Question Management Console
                    </Link>
                </div>
            </div>
        </div>
    );
}
