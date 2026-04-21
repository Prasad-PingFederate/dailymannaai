// src/app/blog/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Book, Sparkles, ArrowRight, Hash } from "lucide-react";
import fs from "fs";
import path from "path";

export const metadata: Metadata = {
    title: "Christian Blog — Bible Answers & Spiritual Insights | DailyManna AI",
    description:
        "Explore Spirit-led blog posts on Christian faith, Bible answers, healing, prayer, and prophetic insights. DailyManna AI's resource hub for believers.",
    alternates: { canonical: "https://www.dailymannaai.com/blog" },
};

const STATIC_POSTS = [
    {
        slug: "how-to-hear-from-god",
        title: "How to Hear from God: A Biblical Guide",
        description:
            "Discover practical, biblical steps to tune your spirit and hear God's voice clearly in your daily life.",
        category: "Prayer",
        date: "2026-04-10",
    },
    {
        slug: "bible-verses-about-healing",
        title: "Bible Verses About Healing — Scripture for Restoration",
        description:
            "Powerful KJV Bible verses about healing for body, mind, and spirit with Spirit-led commentary.",
        category: "Healing",
        date: "2026-04-10",
    },
];

function getQuestionCount(): number {
    try {
        const dataFile = path.join(process.cwd(), "src", "data", "spiritual-questions.json");
        if (!fs.existsSync(dataFile)) return 0;
        const questions = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
        return questions.length;
    } catch {
        return 0;
    }
}

export default function BlogPage() {
    const questionCount = getQuestionCount();

    return (
        <div className="min-h-screen bg-white dark:bg-navy" style={{ fontFamily: "Inter, sans-serif" }}>
            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-2 to-[#0d0a21] py-20 px-6 text-center">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold/10 rounded-full blur-[120px]" />
                </div>
                <div className="relative max-w-3xl mx-auto space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-black uppercase tracking-[0.3em]">
                        <Sparkles size={12} />
                        Spirit-Led Content
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight leading-none">
                        Christian Blog
                    </h1>
                    <p className="text-white/60 text-lg font-serif italic max-w-xl mx-auto">
                        &ldquo;Thy word is a lamp unto my feet, and a light unto my path.&rdquo; — Psalm 119:105
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-16 space-y-16">

                {/* AI Questions Hub Card */}
                <Link
                    href="/blog/questions"
                    className="group block rounded-[2.5rem] bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/20 hover:border-gold/50 p-10 transition-all duration-300 hover:shadow-xl hover:shadow-gold/10"
                >
                    <div className="flex items-start justify-between gap-6">
                        <div className="space-y-4 flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-widest">
                                <Hash size={10} />
                                AI-Generated · {questionCount > 0 ? `${questionCount} Questions` : "Growing Library"}
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-navy dark:text-white tracking-tight">
                                Spiritual Questions Answered
                            </h2>
                            <p className="text-slate-600 dark:text-white/60 text-base leading-relaxed max-w-xl">
                                High-volume Christian questions that millions ask every day — answered with Scripture,
                                theological depth, and Holy Spirit insight. Your complete faith Q&A library.
                            </p>
                        </div>
                        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold group-hover:border-gold transition-all duration-300">
                            <ArrowRight size={24} className="text-gold group-hover:text-white transition-colors" />
                        </div>
                    </div>
                </Link>

                {/* Static Posts */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Book size={16} className="text-gold" />
                        <h3 className="text-xs font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.3em]">Featured Articles</h3>
                        <div className="h-px flex-1 bg-slate-100 dark:bg-white/5" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {STATIC_POSTS.map((post) => (
                            <Link
                                key={post.slug}
                                href={`/blog/${post.slug}`}
                                className="group block rounded-[2rem] bg-slate-50 dark:bg-navy-2 border border-slate-100 dark:border-white/5 hover:border-gold/30 p-8 transition-all duration-300 hover:shadow-lg"
                            >
                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy/5 dark:bg-white/5 text-navy dark:text-gold text-[10px] font-black uppercase tracking-widest">
                                        {post.category}
                                    </div>
                                    <h4 className="text-navy dark:text-white font-bold text-lg leading-snug group-hover:text-gold transition-colors">
                                        {post.title}
                                    </h4>
                                    <p className="text-slate-500 dark:text-white/50 text-sm leading-relaxed">{post.description}</p>
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-[10px] text-slate-400 dark:text-white/30 font-medium">{post.date}</span>
                                        <ArrowRight size={14} className="text-slate-300 dark:text-white/20 group-hover:text-gold transition-colors" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Admin Link */}
                <div className="text-center border-t border-slate-100 dark:border-white/5 pt-10">
                    <Link
                        href="/blog/generate"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-navy dark:bg-white/5 text-white dark:text-white/70 text-xs font-black uppercase tracking-widest hover:bg-navy/80 transition-all"
                    >
                        <Sparkles size={12} />
                        Generate More Questions
                    </Link>
                </div>
            </div>
        </div>
    );
}
