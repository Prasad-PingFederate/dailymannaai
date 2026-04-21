"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    Sparkles, Download, Copy, Check, ChevronRight, Loader2,
    RefreshCw, BookOpen, Hash, Filter, ExternalLink, Trash2, ArrowLeft
} from "lucide-react";

// ── Category Config ──────────────────────────────────────────────────────────

const CATEGORIES = [
    { id: "all", label: "All Topics", emoji: "✨", color: "#D4AF37", desc: "Mix of all spiritual topics" },
    { id: "salvation", label: "Salvation", emoji: "🕊️", color: "#6366f1", desc: "Being born again, eternal life, grace" },
    { id: "prayer", label: "Prayer", emoji: "🙏", color: "#0ea5e9", desc: "How to pray, intercession, fasting" },
    { id: "healing", label: "Healing", emoji: "💚", color: "#22c55e", desc: "Divine healing, restoration" },
    { id: "faith", label: "Faith", emoji: "🌿", color: "#f59e0b", desc: "Trust in God, doubt, miracles" },
    { id: "prophecy", label: "Prophecy", emoji: "🔥", color: "#ef4444", desc: "End times, Revelation, rapture" },
    { id: "relationships", label: "Relationships", emoji: "💛", color: "#ec4899", desc: "Marriage, forgiveness, family" },
    { id: "suffering", label: "Suffering", emoji: "🌧️", color: "#8b5cf6", desc: "Why bad things happen, hope in pain" },
    { id: "holy-spirit", label: "Holy Spirit", emoji: "🕊️", color: "#06b6d4", desc: "Spiritual gifts, fruits, baptism" },
    { id: "church", label: "Church", emoji: "⛪", color: "#10b981", desc: "Worship, communion, baptism" },
    { id: "bible", label: "Bible", emoji: "📖", color: "#f97316", desc: "Bible study, interpretation" },
    { id: "jesus", label: "Jesus", emoji: "👑", color: "#B8860B", desc: "Life, deity, and work of Christ" },
] as const;

const COUNT_OPTIONS = [10, 20, 30, 50];

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

function CopiedIcon() {
    return <Check size={13} className="text-green-500" />;
}

function QuestionRow({
    q,
    idx,
    onCopy,
    copiedSlug,
}: {
    q: Question;
    idx: number;
    onCopy: (text: string, slug: string) => void;
    copiedSlug: string | null;
}) {
    const cat = CATEGORIES.find((c) => c.id === q.category);
    return (
        <div
            className="group flex items-start gap-4 p-5 rounded-2xl border border-slate-100 hover:border-gold/30 hover:bg-gold/5 transition-all duration-200"
            style={{ animationDelay: `${idx * 30}ms` }}
        >
            <div
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white mt-0.5"
                style={{ background: cat?.color || "#D4AF37" }}
            >
                {idx + 1}
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-navy dark:text-white font-semibold text-[15px] leading-snug">{q.question}</p>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <span
                        className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full text-white"
                        style={{ background: cat?.color || "#D4AF37" }}
                    >
                        {cat?.label || q.category}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${q.searchVolume === "high" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                        {q.searchVolume} volume
                    </span>
                    {q.keywords.slice(0, 3).map((kw) => (
                        <span key={kw} className="text-[9px] text-slate-400 dark:text-white/30 font-medium">#{kw}</span>
                    ))}
                </div>
            </div>

            <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onCopy(q.question, q.slug)}
                    className="p-2 rounded-xl bg-white dark:bg-navy-2 border border-slate-200 dark:border-white/10 hover:border-gold/40 transition-all"
                    title="Copy question"
                >
                    {copiedSlug === q.slug ? <CopiedIcon /> : <Copy size={13} className="text-slate-400" />}
                </button>
                <Link
                    href={`/blog/questions/${q.slug}`}
                    target="_blank"
                    className="p-2 rounded-xl bg-white dark:bg-navy-2 border border-slate-200 dark:border-white/10 hover:border-gold/40 transition-all"
                    title="View blog post"
                >
                    <ExternalLink size={13} className="text-slate-400" />
                </Link>
            </div>
        </div>
    );
}

export default function GenerateBlogQuestionsPage() {
    const [selectedCat, setSelectedCat] = useState("all");
    const [count, setCount] = useState(20);
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [total, setTotal] = useState(0);
    const [filterCat, setFilterCat] = useState("all");
    const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingMsg, setLoadingMsg] = useState("");
    const [clearing, setClearing] = useState(false);

    const LOADING_MSGS = [
        "Consulting Holy Scripture...",
        "Analyzing spiritual search trends...",
        "Crafting high-volume questions...",
        "Infusing with biblical wisdom...",
        "Finalizing your question library...",
    ];

    // Load existing questions on mount
    useEffect(() => {
        fetchQuestions();
    }, []);

    // Rotate loading message
    useEffect(() => {
        if (!loading) return;
        let i = 0;
        setLoadingMsg(LOADING_MSGS[0]);
        const interval = setInterval(() => {
            i = (i + 1) % LOADING_MSGS.length;
            setLoadingMsg(LOADING_MSGS[i]);
        }, 2500);
        return () => clearInterval(interval);
    }, [loading]);

    async function fetchQuestions(cat?: string) {
        try {
            const url = cat && cat !== "all"
                ? `/api/generate-questions?category=${cat}`
                : `/api/generate-questions`;
            const res = await fetch(url);
            const data = await res.json();
            setQuestions(data.questions || []);
            setTotal(data.total || 0);
        } catch (e) {
            console.error("Failed to fetch questions:", e);
        }
    }

    async function handleGenerate() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/generate-questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ count, category: selectedCat }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Generation failed");
            await fetchQuestions(filterCat !== "all" ? filterCat : undefined);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleClear() {
        if (!confirm("⚠️ This will delete ALL generated questions. Are you sure?")) return;
        setClearing(true);
        try {
            await fetch("/api/generate-questions", { method: "DELETE" });
            setQuestions([]);
            setTotal(0);
        } finally {
            setClearing(false);
        }
    }

    function handleCopy(text: string, slug: string) {
        navigator.clipboard.writeText(text);
        setCopiedSlug(slug);
        setTimeout(() => setCopiedSlug(null), 2000);
    }

    function handleDownload() {
        const lines = questions.map((q, i) => `${i + 1}. ${q.question}`).join("\n");
        const blob = new Blob([`DAILYMANNAAI — SPIRITUAL BLOG QUESTIONS\n${"─".repeat(50)}\n\n${lines}`], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `spiritual-questions-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function handleFilterChange(cat: string) {
        setFilterCat(cat);
        await fetchQuestions(cat !== "all" ? cat : undefined);
    }

    const displayQuestions = questions;

    return (
        <div className="min-h-screen bg-white dark:bg-navy" style={{ fontFamily: "Inter, sans-serif" }}>
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-2 to-[#0d0a21] px-6 py-16">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gold/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[80px]" />
                </div>
                <div className="relative max-w-5xl mx-auto">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-white/40 hover:text-white/80 text-xs font-black uppercase tracking-widest transition-colors mb-8"
                    >
                        <ArrowLeft size={12} /> Blog
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-[0.3em]">
                                <Sparkles size={11} />
                                AI Question Generator
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
                                Spiritual Blog<br />
                                <span className="text-gold">Questions Generator</span>
                            </h1>
                            <p className="text-white/50 text-base leading-relaxed max-w-lg">
                                Generate high-search-volume Christian questions that millions of people ask every day.
                                Use them as blog post titles to grow your spiritual content library.
                            </p>
                        </div>

                        {total > 0 && (
                            <div className="flex-shrink-0 bg-white/5 border border-white/10 rounded-2xl p-6 text-center min-w-[160px]">
                                <div className="text-5xl font-black text-gold">{total}</div>
                                <div className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">Questions Generated</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">

                {/* ── GENERATOR PANEL ───────────────────────────────────── */}
                <div className="rounded-[2.5rem] border border-gold/20 bg-gradient-to-br from-gold/5 via-transparent to-transparent p-8 md:p-10 space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center">
                            <Sparkles size={14} className="text-gold" />
                        </div>
                        <h2 className="text-lg font-black text-navy dark:text-white uppercase tracking-[0.1em]">Generate New Questions</h2>
                    </div>

                    {/* Category Picker */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                            Topic Category
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCat(cat.id)}
                                    className={`relative flex flex-col items-start gap-1.5 p-4 rounded-2xl border text-left transition-all duration-200 ${
                                        selectedCat === cat.id
                                            ? "border-gold bg-gold/10 shadow-lg shadow-gold/10"
                                            : "border-slate-200 dark:border-white/10 hover:border-gold/30 bg-white dark:bg-navy-2"
                                    }`}
                                >
                                    <span className="text-lg">{cat.emoji}</span>
                                    <span className={`text-xs font-black uppercase tracking-wider ${selectedCat === cat.id ? "text-gold" : "text-navy dark:text-white"}`}>
                                        {cat.label}
                                    </span>
                                    <span className="text-[9px] text-slate-400 dark:text-white/30 leading-snug">{cat.desc}</span>
                                    {selectedCat === cat.id && (
                                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-gold flex items-center justify-center">
                                            <Check size={9} className="text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Count Picker */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                            How Many Questions?
                        </label>
                        <div className="flex gap-3">
                            {COUNT_OPTIONS.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setCount(c)}
                                    className={`w-16 h-12 rounded-xl font-black text-sm transition-all ${
                                        count === c
                                            ? "bg-navy dark:bg-gold text-white dark:text-navy shadow-lg"
                                            : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/10"
                                    }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 text-sm text-red-700 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="flex items-center justify-center gap-3 w-full md:w-auto md:min-w-[280px] py-5 px-10 rounded-2xl bg-gradient-to-r from-gold to-gold-2 hover:from-gold-2 hover:to-gold text-navy font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-gold/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>{loadingMsg}</span>
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                Generate {count} Questions
                            </>
                        )}
                    </button>
                </div>

                {/* ── QUESTIONS LIBRARY ───────────────────────────────────── */}
                {questions.length > 0 && (
                    <div className="space-y-6">
                        {/* Library Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <BookOpen size={16} className="text-gold" />
                                <h2 className="text-base font-black text-navy dark:text-white uppercase tracking-[0.1em]">
                                    Question Library
                                </h2>
                                <span className="px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black">
                                    {displayQuestions.length} questions
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white/60 text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    <Download size={12} /> Export All
                                </button>
                                <button
                                    onClick={() => fetchQuestions(filterCat !== "all" ? filterCat : undefined)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white/60 text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    <RefreshCw size={12} /> Refresh
                                </button>
                                <button
                                    onClick={handleClear}
                                    disabled={clearing}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    <Trash2 size={12} /> {clearing ? "Clearing..." : "Clear All"}
                                </button>
                            </div>
                        </div>

                        {/* Filter by Category */}
                        <div className="flex flex-wrap gap-2">
                            {[{ id: "all", label: "All" }, ...CATEGORIES.filter((c) => c.id !== "all")].map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleFilterChange(cat.id)}
                                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                        filterCat === cat.id
                                            ? "bg-navy dark:bg-gold text-white dark:text-navy"
                                            : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/10"
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Questions List */}
                        <div className="space-y-2">
                            {displayQuestions.map((q, i) => (
                                <QuestionRow
                                    key={q.slug}
                                    q={q}
                                    idx={i}
                                    onCopy={handleCopy}
                                    copiedSlug={copiedSlug}
                                />
                            ))}
                        </div>

                        {/* CTA */}
                        <div className="rounded-[2rem] bg-gradient-to-br from-navy to-navy-2 border border-white/10 p-8 text-center space-y-4">
                            <h3 className="text-white font-black text-xl">Ready to Write Your Blog Posts?</h3>
                            <p className="text-white/50 text-sm max-w-md mx-auto">
                                View your question library as a public blog, or ask DailyManna AI to write the full post for any question.
                            </p>
                            <div className="flex flex-wrap gap-3 justify-center">
                                <Link
                                    href="/blog/questions"
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-navy text-xs font-black uppercase tracking-widest hover:bg-gold/90 transition-all"
                                >
                                    <BookOpen size={13} /> View Question Library
                                </Link>
                                <Link
                                    href="/?filter=ai"
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                                >
                                    <Sparkles size={13} /> Ask AI to Write a Post
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {questions.length === 0 && !loading && (
                    <div className="text-center py-24 space-y-5">
                        <div className="mx-auto w-20 h-20 rounded-[2rem] bg-gold/10 border border-gold/20 flex items-center justify-center">
                            <Hash size={32} className="text-gold" />
                        </div>
                        <h3 className="text-navy dark:text-white font-black text-2xl">No Questions Yet</h3>
                        <p className="text-slate-500 dark:text-white/40 text-sm max-w-sm mx-auto">
                            Select a category and click &quot;Generate Questions&quot; to create your spiritual blog question library.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
