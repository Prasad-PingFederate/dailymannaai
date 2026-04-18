"use client";

import React, { useState, useEffect } from "react";
import { Quote, Sparkles, Zap, Newspaper, Book, BookOpen, Share2, Bookmark, Star, ArrowUpRight, Check, X, Bell } from "lucide-react";

const todayLabel = () => {
    const d = new Date();
    return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
};

const todayKey = () => {
    const d = new Date();
    // Simplified key for storage/cache
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

async function fetchDevotion(slot: number) {
    const dateKey = todayKey();
    const dateLabel = todayLabel();

    const res = await fetch("/api/devotionals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot, dateLabel, dateKey })
    });

    if (!res.ok) throw new Error("Failed to generate devotional");
    return await res.json();
}

const CrossIcon = () => (
    <div className="text-[#C8973A]">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="12" y="2" width="4" height="24" rx="2" fill="currentColor" />
            <rect x="4" y="10" width="20" height="4" rx="2" fill="currentColor" />
        </svg>
    </div>
);

const BookmarkIcon = ({ filled }: { filled: boolean }) => (
    <Bookmark size={18} className={filled ? "fill-current" : ""} />
);

interface DevotionalResult {
    title: string;
    subtitle: string;
    scripture: { verse: string; reference: string; book: string };
    opening_prayer: string;
    body: { heading: string; content: string }[];
    closing_reflection: string;
    closing_prayer: string;
    theme_tags: string[];
    key_truth: string;
    sermon_reference?: { teacher: string; sermon_title: string; passage: string };
}

function DevotionalCard({ devotion, slot, loading, error, onRetry }: { devotion: DevotionalResult | null, slot: number, loading: boolean, error: boolean, onRetry: () => void }) {
    const [expanded, setExpanded] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [copied, setCopied] = useState(false);

    const isM = slot === 1;
    const accent = isM ? "#C8973A" : "#7B6FA0";
    const accentLight = isM ? "#FDF6E7" : "#F0EEF8";
    const label = isM ? "MORNING" : "EVENING";
    const labelIcon = isM ? "🌅" : "🌙";

    const handleCopy = () => {
        if (!devotion) return;
        const text = `${devotion.title}\n${devotion.scripture.verse}\n— ${devotion.scripture.reference}\n\n${devotion.key_truth}\n\n[Daily Manna AI Devotional]`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-[#FEFCF8] rounded-[32px] overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-sky-500/10 mb-12 border border-slate-200 animate-in fade-in slide-in-from-bottom-5">
            {/* Header Band */}
            <div
                className="px-6 md:px-10 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                style={{
                    background: isM
                        ? "linear-gradient(135deg, #C8973A 0%, #8B6914 100%)"
                        : "linear-gradient(135deg, #7B6FA0 0%, #4A3F7A 100%)"
                }}
            >
                <div className="flex items-center gap-4">
                    <span className="text-2xl">{labelIcon}</span>
                    <div>
                        <div className="text-white/70 text-[10px] font-black tracking-[0.4em] uppercase">
                            {label} DEVOTIONAL
                        </div>
                        <div className="text-white text-xs font-medium opacity-90">{todayLabel()}</div>
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <button
                        onClick={() => setBookmarked(b => !b)}
                        className={`p-2.5 rounded-full transition-all ${bookmarked ? 'bg-white text-slate-900 shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                    >
                        <BookmarkIcon filled={bookmarked} />
                    </button>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-md transition-all active:scale-95"
                    >
                        {copied ? <Check size={14} /> : <Share2 size={14} />}
                        {copied ? "COPIED" : "SHARE"}
                    </button>
                </div>
            </div>

            <div className="p-6 md:p-16">
                {loading && (
                    <div className="flex flex-col items-center justify-center py-24 space-y-6">
                        <div className="relative">
                            <div className="text-6xl animate-bounce">⛪</div>
                            <div className="absolute -top-2 -right-2">
                                <Sparkles className="text-amber-400 animate-pulse" size={20} />
                            </div>
                        </div>
                        <div className="text-slate-400 font-black text-[11px] tracking-[0.6em] uppercase text-center max-w-xs leading-relaxed animate-pulse">
                            Gathering Spiritual Manna for today...
                        </div>
                    </div>
                )}

                {error && (
                    <div className="text-center py-16 space-y-6">
                        <div className="text-5xl">🕊️</div>
                        <p className="text-slate-500 font-serif italic text-lg max-w-sm mx-auto">
                            The spiritual channels are momentarily clouded. Please seek again in a moment.
                        </p>
                        <button
                            onClick={onRetry}
                            className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-sky-600 transition-all active:scale-95 shadow-2xl shadow-sky-500/20"
                        >
                            Reset Connection
                        </button>
                    </div>
                )}

                {devotion && !loading && (
                    <>
                        {/* Title Section */}
                        <div className="mb-12">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-px flex-1 bg-slate-100" />
                                <Sparkles size={16} style={{ color: accent }} className="opacity-40" />
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>
                            <h2 className="text-4xl md:text-6xl font-['Cinzel'] font-black text-slate-900 leading-[1.1] mb-4 italic text-center">
                                {devotion.title}
                            </h2>
                            <p className="text-slate-400 text-xl font-serif italic text-center max-w-2xl mx-auto">
                                {devotion.subtitle}
                            </p>
                        </div>

                        {/* Scripture Box */}
                        <div
                            className="rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 mb-16 border-l-8 transition-transform hover:scale-[1.01]"
                            style={{
                                backgroundColor: accentLight,
                                borderColor: accent,
                                boxShadow: `0 20px 60px ${accent}08`
                            }}
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <BookOpen size={16} style={{ color: accent }} />
                                <span className="text-[11px] font-black uppercase tracking-[0.5em]" style={{ color: accent }}>
                                    Canonical Scripture
                                </span>
                                <div className="h-px flex-1 bg-current opacity-10" style={{ color: accent }} />
                            </div>
                            <blockquote className="text-3xl md:text-4xl font-serif italic text-slate-800 leading-relaxed mb-10">
                                &ldquo;{devotion.scripture.verse}&rdquo;
                            </blockquote>
                            <div className="flex flex-col md:flex-row md:items-center justify-between border-t gap-6 pt-10" style={{ borderColor: `${accent}20` }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-black/5">
                                        <Book size={18} style={{ color: accent }} />
                                    </div>
                                    <span className="font-black text-slate-900 text-2xl tracking-tight">
                                        {devotion.scripture.reference}
                                    </span>
                                </div>
                                <button
                                    onClick={() => window.open(`https://www.biblegateway.com/passage/?search=${encodeURIComponent(devotion.scripture.reference)}&version=KJV`, '_blank')}
                                    className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-sky-600 transition-all"
                                >
                                    Explore Full Context
                                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </button>
                            </div>
                        </div>

                        {/* Prayer & Key Truth Loop */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                            {/* Opening Prayer */}
                            <div className="p-8 md:p-10 bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Bell size={40} />
                                </div>
                                <div className="text-amber-600 font-black text-[10px] tracking-[0.4em] uppercase mb-6 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    Invoking the Spirit
                                </div>
                                <p className="text-xl leading-relaxed text-slate-700 font-serif italic">
                                    "{devotion.opening_prayer}"
                                </p>
                            </div>

                            {/* Key Truth */}
                            <div className="p-8 md:p-10 bg-slate-900 text-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                <div className="absolute -bottom-6 -right-6 text-white/5 opacity-40 group-hover:scale-125 transition-transform duration-1000">
                                    <Zap size={100} />
                                </div>
                                <div className="text-sky-400 font-black text-[10px] tracking-[0.5em] uppercase mb-6 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                                    The Eternal Truth
                                </div>
                                <p className="text-2xl md:text-3xl font-['Cinzel'] italic leading-tight relative z-10">
                                    {devotion.key_truth}
                                </p>
                            </div>
                        </div>

                        {/* Main Exposition */}
                        <div className="space-y-16 mb-20 bg-white p-8 md:p-16 rounded-[2rem] md:rounded-[4rem] border border-slate-100 shadow-sm">
                            {devotion.body.slice(0, 2).map((section, i) => (
                                <div key={i} className="group relative">
                                    <div className="absolute -left-10 md:-left-12 top-0 py-1 text-sky-500/20 font-black text-2xl tracking-tighter">0{i + 1}</div>
                                    <h3 className="text-sky-600 font-black text-[11px] tracking-[0.5em] uppercase mb-6 flex items-center gap-4">
                                        {section.heading}
                                        <div className="h-px flex-1 bg-sky-100" />
                                    </h3>
                                    <p className="text-2xl leading-relaxed text-slate-700 font-serif italic">{section.content}</p>
                                </div>
                            ))}

                            {/* Expandable Sections */}
                            {!expanded && devotion.body.length > 2 && (
                                <div className="pt-10 flex justify-center">
                                    <button
                                        onClick={() => setExpanded(true)}
                                        className="group flex flex-col items-center gap-4 transition-all"
                                    >
                                        <div
                                            className="w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-500 shadow-2xl relative"
                                            style={{
                                                borderColor: `${accent}40`,
                                                backgroundColor: `${accent}05`,
                                                color: accent,
                                                boxShadow: `0 0 30px ${accent}20`
                                            }}
                                        >
                                            {/* Pulsing ring */}
                                            <div
                                                className="absolute inset-0 rounded-full animate-ping opacity-20"
                                                style={{ backgroundColor: accent, animationDuration: '3s' }}
                                            />

                                            <ArrowUpRight
                                                className="rotate-90 group-hover:translate-y-1.5 transition-transform duration-500"
                                                size={28}
                                            />
                                        </div>
                                        <span
                                            className="font-black text-[11px] tracking-[0.5em] uppercase transition-all group-hover:tracking-[0.6em]"
                                            style={{ color: accent }}
                                        >
                                            Deepen the Revelation
                                        </span>
                                    </button>
                                </div>
                            )}

                            {expanded && devotion.body.slice(2).map((section, i) => (
                                <div key={i + 2} className="group relative animate-in fade-in slide-in-from-bottom-8 duration-700">
                                    <div className="absolute -left-10 md:-left-12 top-0 py-1 text-sky-500/20 font-black text-2xl tracking-tighter">0{i + 3}</div>
                                    <h3 className="text-sky-600 font-black text-[11px] tracking-[0.5em] uppercase mb-6 flex items-center gap-4">
                                        {section.heading}
                                        <div className="h-px flex-1 bg-sky-100" />
                                    </h3>
                                    <p className="text-2xl leading-relaxed text-slate-700 font-serif italic">{section.content}</p>
                                </div>
                            ))}
                        </div>

                        {/* Bottom Wrap: Reflection & Prayer */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
                            {/* Closing Reflection */}
                            <div className="md:col-span-7 space-y-8">
                                <div>
                                    <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                                        <Sparkles size={12} />
                                        Sacred Synthesis
                                    </div>
                                    <p className="text-3xl leading-snug text-slate-900 font-serif italic">&ldquo;{devotion.closing_reflection}&rdquo;</p>
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2 pt-4">
                                    {devotion.theme_tags?.map((t, i) => (
                                        <span key={i} className="bg-slate-100 text-slate-400 rounded-full px-5 py-2 text-[9px] font-black tracking-widest uppercase cursor-default hover:bg-slate-200 hover:text-slate-600 transition-all">
                                            #{t}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Right Side: Closing Prayer & Sermon Ref */}
                            <div className="md:col-span-5 space-y-8">
                                <div className="bg-slate-50 border border-slate-200 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group">
                                    <div className="absolute -top-4 -left-4 text-slate-100 group-hover:scale-110 transition-transform duration-500">
                                        <Quote size={80} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-slate-400 font-black text-[9px] tracking-[0.4em] uppercase mb-6 flex items-center gap-2">
                                            <Bell size={12} className="opacity-40" />
                                            Final Prayer
                                        </div>
                                        <p className="text-lg leading-relaxed text-slate-600 font-serif italic">
                                            "{devotion.closing_prayer}"
                                        </p>
                                    </div>
                                </div>

                                {devotion.sermon_reference && (
                                    <div className="px-8 md:px-10 py-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl relative group">
                                        <div className="text-sky-400 font-black text-[9px] tracking-[0.4em] uppercase mb-4">Sermonic Depth</div>
                                        <h4 className="text-xl font-['Cinzel'] italic mb-1 text-white group-hover:text-sky-300 transition-colors">
                                            {devotion.sermon_reference.teacher}
                                        </h4>
                                        <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase">
                                            {devotion.sermon_reference.passage}
                                        </p>
                                        <Star size={16} className="absolute top-8 right-10 text-amber-500 fill-amber-500 opacity-40 animate-pulse" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function DevotionalsTab() {
    const [devotions, setDevotions] = useState<DevotionalResult[]>([null as any, null as any]);
    const [loading, setLoading] = useState([true, true]);
    const [errors, setErrors] = useState([false, false]);

    const load = async (slot: number) => {
        const idx = slot - 1;
        setLoading(l => { const n = [...l]; n[idx] = true; return n; });
        setErrors(e => { const n = [...e]; n[idx] = false; return n; });
        try {
            const data = await fetchDevotion(slot);
            setDevotions(d => { const n = [...d]; n[idx] = data; return n; });
        } catch (err) {
            console.error(err);
            setErrors(e => { const n = [...e]; n[idx] = true; return n; });
        } finally {
            setLoading(l => { const n = [...l]; n[idx] = false; return n; });
        }
    };

    useEffect(() => {
        load(1);
        load(2);
    }, []);

    return (
        <div className="w-full max-w-5xl mx-auto py-16 px-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {/* Page Header */}
            <div className="text-center mb-20 space-y-8">
                <div className="flex justify-center">
                    <div className="relative group">
                        <CrossIcon />
                        <div className="absolute -inset-4 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors" />
                    </div>
                </div>
                <div className="space-y-4">
                    <h1 className="font-['Cinzel'] text-5xl md:text-8xl font-black text-slate-900 tracking-tighter leading-none">
                        Daily <span className="text-sky-600">Revelation</span>
                    </h1>
                    <div className="flex items-center justify-center gap-6">
                        <div className="h-px w-16 bg-gradient-to-r from-transparent to-slate-200" />
                        <p className="text-slate-400 font-serif italic text-2xl">
                            Sustenance for the Soul.
                        </p>
                        <div className="h-px w-16 bg-gradient-to-l from-transparent to-slate-200" />
                    </div>
                    <div className="pt-4 flex justify-center">
                        <div className="px-6 py-2 rounded-full border border-slate-200 bg-slate-50 text-[10px] font-black tracking-[0.5em] text-slate-500 uppercase">
                            {todayLabel()}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-10 mt-12 opacity-60">
                    {["Repentance", "Salvation", "Substitutionary Atonement", "The Resurrection", "Eternal Life"].map((t) => (
                        <span key={t} className="flex items-center gap-3 text-[10px] font-black tracking-[0.4em] text-slate-400 uppercase group hover:text-sky-500 transition-colors cursor-default">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-sky-400 group-hover:scale-150 transition-all" />
                            {t}
                        </span>
                    ))}
                </div>
            </div>

            {/* Devotional Cards */}
            <div className="space-y-20">
                <DevotionalCard
                    devotion={devotions[0]} slot={1}
                    loading={loading[0]} error={errors[0]}
                    onRetry={() => load(1)}
                />
                <DevotionalCard
                    devotion={devotions[1]} slot={2}
                    loading={loading[1]} error={errors[1]}
                    onRetry={() => load(2)}
                />
            </div>

            {/* Page Footer */}
            <footer className="mt-32 pt-20 border-t border-slate-100 text-center space-y-8">
                <div className="max-w-xl mx-auto space-y-6">
                    <Quote className="mx-auto text-slate-200" size={40} />
                    <p className="text-slate-500 text-2xl font-serif italic leading-relaxed">
                        "Thy word is a lamp unto my feet, and a light unto my path."
                        <span className="block mt-4 text-sky-600/40 font-black text-[11px] tracking-[0.6em] uppercase not-italic">— Psalm 119:105</span>
                    </p>
                </div>
                <div className="pt-10 flex flex-col items-center gap-4">
                    <div className="font-['Cinzel'] text-sm font-black text-slate-900 tracking-widest">
                        DAILY<span className="text-sky-600">MANNA</span>AI
                    </div>
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Powered by the living word of god</div>
                </div>
            </footer>
        </div>
    );
}
