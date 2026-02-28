"use client";

import React, { useState, useEffect } from "react";
import { Search, Book, Newspaper, Sparkles, MessageCircle, X, ExternalLink, Filter, Clock, Calculator, Calendar } from "lucide-react";
import Link from "next/link";

interface SearchResult {
    title: string;
    description: string;
    link?: string;
    source?: string;
    grace_rank?: number;
    bible_refs?: string[];
}

export default function SearchEnginePortal() {
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<"bible" | "news" | "devotionals" | "sermons">("bible");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [instantAnswer, setInstantAnswer] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [hasTyped, setHasTyped] = useState(false);
    const [dailyVerse] = useState({ ref: "John 3:16", text: "For God so loved the world that He gave His one and only Son..." });

    const handleSearch = async (e?: React.FormEvent, currentType?: string) => {
        if (e) e.preventDefault();
        const searchQuery = query.trim();
        if (!searchQuery) return;

        const searchType = currentType || filter;

        setIsSearching(true);
        setHasTyped(true);
        setResults([]); // Clear previous results
        setInstantAnswer(null);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`);
            const data = await res.json();
            if (res.ok) {
                setResults(data.results || []);
                setInstantAnswer(data.instantAnswer);
            }
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsSearching(false);
        }
    };

    // Auto-search when filter changes if query exists
    useEffect(() => {
        if (query.trim()) {
            handleSearch(undefined, filter);
        }
    }, [filter]);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 relative flex flex-col items-center selection:bg-sky-500/30 overflow-hidden">
            {/* --- COSMIC BACKGROUND --- */}
            <div className="stars" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />

            {/* --- HEADER --- */}
            <header className={`w-full max-w-7xl px-4 md:px-8 py-6 flex items-center justify-between z-10 transition-all duration-700 ${hasTyped ? 'translate-y-0 opacity-100' : 'translate-y-0'}`}>
                <div className="flex items-center gap-10">
                    <div
                        className="flex items-center gap-1 cursor-pointer"
                        onClick={() => { setHasTyped(false); setQuery(""); setResults([]); }}
                    >
                        <span className="font-['Cinzel'] text-2xl font-bold tracking-tight">
                            DAILY<span className="text-sky-400">MANNA</span>AI
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/notebook" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-full text-sm font-medium transition-all backdrop-blur-md">
                        <MessageCircle size={14} className="text-sky-400" />
                        Notebook Workspace
                    </Link>
                </div>
            </header>

            {/* --- MAIN CONTENT --- */}
            <main className={`flex-1 w-full flex flex-col items-center transition-all duration-700 z-10 ${hasTyped ? 'pt-4' : 'pt-32'}`}>

                {/* Brand & Hero (Hides when results show) */}
                <div className={`text-center space-y-8 mb-12 transition-all duration-700 ${hasTyped ? 'opacity-0 h-0 overflow-hidden -translate-y-10' : 'opacity-100'}`}>
                    <div className="text-xs font-bold text-sky-400 tracking-[0.4em] uppercase mb-4 animate-pulse">Your word is a lamp to my feet and a light to my path. — Psalm 119:105</div>
                    <div className="relative inline-block">
                        <h1 className="font-['Cinzel'] text-5xl md:text-8xl font-black tracking-tighter text-white">
                            DAILY<span className="text-sky-400">MANNA</span>AI
                        </h1>
                        <div className="absolute -right-12 -top-4 bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-400/30 backdrop-blur-sm">PRO INDEX</div>
                    </div>

                    {/* Verse of the Day Card */}
                    <div className="mt-12 group">
                        <div className="mx-auto max-w-xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-6 rounded-2xl relative transition-all group-hover:border-sky-400/30">
                            <Sparkles className="absolute -top-3 -left-3 text-amber-400 w-6 h-6 animate-bounce-subtle" />
                            <p className="text-slate-300 italic text-base leading-relaxed font-serif">
                                "{dailyVerse.text}"
                            </p>
                            <div className="text-[11px] font-bold text-amber-400 mt-4 tracking-[0.2em] uppercase">— {dailyVerse.ref}</div>
                        </div>
                    </div>
                </div>

                {/* --- SEARCH BOX --- */}
                <div className={`w-full transition-all duration-700 flex flex-col items-center ${hasTyped ? 'max-w-7xl px-4 md:px-8' : 'max-w-3xl px-6'}`}>
                    <form
                        onSubmit={handleSearch}
                        className={`w-full flex items-center gap-4 ${hasTyped ? 'flex-col md:flex-row md:items-center' : 'flex-col'}`}
                    >
                        <div className={`relative group w-full ${hasTyped ? 'md:max-w-2xl' : ''}`}>
                            <div className="absolute inset-0 bg-sky-500/20 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-2 flex items-center transition-all focus-within:border-sky-500/50 hover:border-white/20 shadow-2xl">
                                <Search className="text-slate-400 w-5 h-5 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Seek and ye shall find..."
                                    className="flex-1 bg-transparent border-none outline-none px-4 py-4 text-lg text-white placeholder:text-slate-500"
                                />
                                {query && (
                                    <button
                                        type="button"
                                        onClick={() => setQuery("")}
                                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <X size={20} className="text-slate-400" />
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="hidden md:flex ml-2 bg-sky-500 hover:bg-sky-400 text-white font-bold px-6 py-2 rounded-full text-sm transition-all shadow-lg active:scale-95"
                                >
                                    SEARCH
                                </button>
                            </div>
                        </div>

                        {/* DESKTOP FILTERS (Inline when searching) */}
                        {hasTyped && (
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 w-full md:w-auto">
                                <div className="flex items-center gap-2 mr-2 border-r border-white/10 pr-4">
                                    <Filter size={12} className="text-slate-500" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Filters:</span>
                                </div>
                                {[
                                    { id: 'bible', label: 'Bible', icon: <Book size={14} /> },
                                    { id: 'news', label: 'News', icon: <Newspaper size={14} /> },
                                    { id: 'devotionals', label: 'Devotionals', icon: <Sparkles size={14} /> },
                                    { id: 'sermons', label: 'Sermons', icon: <MessageCircle size={14} /> }
                                ].map((btn) => (
                                    <button
                                        key={btn.id}
                                        type="button"
                                        onClick={() => setFilter(btn.id as any)}
                                        className={`flex items-center gap-2 px-5 py-2 rounded-full border transition-all text-xs font-bold whitespace-nowrap uppercase tracking-wider ${filter === btn.id
                                            ? 'bg-white/10 border-white/20 text-white shadow-lg'
                                            : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                            }`}
                                    >
                                        {btn.icon}
                                        {btn.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {!hasTyped && (
                            <div className="flex gap-4 mt-8">
                                <button
                                    type="submit"
                                    className="bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-3 rounded-full text-sm font-bold text-sky-400 transition-all hover:scale-105 active:scale-95 backdrop-blur-md"
                                >
                                    DAILY SEARCH
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSearch(undefined, 'bible')}
                                    className="bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-3 rounded-full text-sm font-bold text-amber-400 transition-all hover:scale-105 active:scale-95 backdrop-blur-md"
                                >
                                    FEELING SPIRITUAL
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {/* --- RESULTS SECTION --- */}
                {hasTyped && (
                    <div className="w-full max-w-7xl px-4 md:px-8 mt-12 pb-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        {isSearching ? (
                            <div className="py-24 flex flex-col items-center gap-6">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-sky-500/20 rounded-full" />
                                    <div className="absolute top-0 w-16 h-16 border-4 border-sky-400 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
                                </div>
                                <div className="text-slate-400 text-sm font-medium tracking-[0.2em] uppercase animate-pulse">Connecting to Global Index...</div>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                                <div className="lg:col-span-3 space-y-10">
                                    <div className="flex items-center gap-3 text-xs text-slate-500 font-bold uppercase tracking-[0.2em] border-b border-white/5 pb-4">
                                        <Book size={14} className="text-sky-400" />
                                        Found {results.length} results for <span className="text-sky-400 italic">"{query}"</span> in {filter.toUpperCase()}
                                    </div>

                                    {/* --- INSTANT ANSWER WIDGET --- */}
                                    {instantAnswer && (
                                        <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-8 mb-10 overflow-hidden relative group animate-in zoom-in-95 duration-500">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                {instantAnswer.type === 'calculator' && <Calculator size={100} />}
                                                {instantAnswer.type === 'time' && <Clock size={100} />}
                                                {instantAnswer.type === 'date' && <Calendar size={100} />}
                                                {instantAnswer.type === 'bible' && <Book size={100} />}
                                                {instantAnswer.type === 'age' && <Sparkles size={100} />}
                                            </div>

                                            <div className="relative z-10">
                                                <div className="flex items-center gap-2 text-sky-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                                                    <Sparkles size={12} className="animate-pulse" />
                                                    {instantAnswer.title || "Instant Answer"}
                                                </div>

                                                <div className="flex flex-col gap-1">
                                                    <div className="text-5xl md:text-6xl font-black text-white tracking-tighter">
                                                        {instantAnswer.result || instantAnswer.description}
                                                    </div>
                                                    {instantAnswer.subtitle && (
                                                        <div className="text-slate-400 text-sm font-medium tracking-wide mt-2">
                                                            {instantAnswer.subtitle}
                                                        </div>
                                                    )}
                                                </div>

                                                {instantAnswer.type === 'bible' && (
                                                    <div className="mt-8 pt-8 border-t border-white/5">
                                                        <Link href="/notebook" className="inline-flex items-center gap-2 text-xs font-bold text-sky-400 hover:underline tracking-widest uppercase">
                                                            View in Study Notebook <ExternalLink size={12} />
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500/0 via-sky-500/50 to-sky-500/0" />
                                        </div>
                                    )}

                                    <div className="space-y-12">
                                        {results.map((res, i) => (
                                            <div key={i} className="group relative">
                                                <div className="absolute -inset-4 bg-white/[0.02] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                                {filter === 'bible' ? (
                                                    <div className="relative space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-0.5 w-6 bg-sky-500" />
                                                            <span className="text-xs font-black text-sky-400 tracking-[0.3em] uppercase">{res.title}</span>
                                                        </div>
                                                        <p className="text-slate-200 text-xl font-serif leading-relaxed group-hover:text-white transition-colors">
                                                            "{res.description}"
                                                        </p>
                                                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                            <span>KING JAMES VERSION (KJV)</span>
                                                            <div className="w-1 h-1 rounded-full bg-slate-700" />
                                                            <span>AUTHENTIC SCRIPTURE</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="relative space-y-3">
                                                        <div className="flex items-center gap-3 text-[10px] font-black tracking-[0.2em] uppercase">
                                                            <span className="text-sky-400">{res.source || "Discovery Index"}</span>
                                                            {res.grace_rank && res.grace_rank > 0.8 && (
                                                                <span className="bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded border border-amber-400/20 flex items-center gap-1">
                                                                    <Sparkles size={10} /> VERIFIED MINISTRY
                                                                </span>
                                                            )}
                                                        </div>
                                                        <a
                                                            href={res.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block"
                                                        >
                                                            <h3 className="text-2xl text-white font-bold group-hover:text-sky-400 transition-colors leading-tight inline-flex items-center gap-2">
                                                                {res.title}
                                                                <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 -translate-y-1 transition-all" />
                                                            </h3>
                                                        </a>
                                                        <p className="text-slate-400 text-base leading-relaxed line-clamp-2 max-w-3xl">
                                                            {res.description}
                                                        </p>

                                                        {res.bible_refs && res.bible_refs.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 pt-2">
                                                                {res.bible_refs.map((ref, idx) => (
                                                                    <button
                                                                        key={idx}
                                                                        onClick={() => {
                                                                            setFilter('bible');
                                                                            setQuery(ref);
                                                                            handleSearch(undefined, 'bible');
                                                                        }}
                                                                        className="flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-[10px] font-bold text-sky-400 hover:bg-sky-500/20 transition-all uppercase tracking-wider"
                                                                    >
                                                                        <Book size={10} />
                                                                        {ref}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Sidebar (Knowledge Panel Style) */}
                                <div className="hidden lg:block space-y-8">
                                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 sticky top-10">
                                        <div className="text-[10px] font-bold text-sky-400 tracking-[0.4em] mb-6 uppercase">Divine Insight</div>
                                        <h2 className="text-3xl font-black text-white mb-6 tracking-tighter">{query}</h2>
                                        <div className="text-sm text-slate-400 leading-relaxed font-sans mb-10 border-l-2 border-sky-500/30 pl-6">
                                            Synthesizing theological context and scriptural foundations for <span className="text-sky-300">"{query}"</span> across our global Christian index.
                                        </div>

                                        <div className="pt-8 border-t border-white/5">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Cross References</div>
                                            <div className="space-y-6">
                                                {results.slice(0, 4).map((r, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex gap-4 items-start group cursor-pointer"
                                                        onClick={() => {
                                                            if (filter === 'bible') {
                                                                setQuery(r.title);
                                                                handleSearch(undefined, 'bible');
                                                            }
                                                        }}
                                                    >
                                                        <div className="w-6 h-6 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 text-[10px] group-hover:bg-sky-400 group-hover:text-white transition-all font-bold">
                                                            {idx + 1}
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-300 group-hover:text-sky-400 transition-colors leading-tight">{r.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-32 space-y-6 flex flex-col items-center">
                                <div className="w-20 h-20 bg-white/[0.03] rounded-full flex items-center justify-center border border-white/10">
                                    <Search className="text-slate-700 w-8 h-8" />
                                </div>
                                <div className="max-w-md">
                                    <div className="text-slate-300 font-bold text-xl mb-2 italic">Seek, and ye shall find...</div>
                                    <p className="text-slate-500 text-sm leading-relaxed uppercase tracking-widest px-10">Unfortunately, the prompt <span className="text-sky-400">"{query}"</span> was not found in our current indices.</p>
                                </div>
                                <button
                                    onClick={() => setQuery("")}
                                    className="text-xs font-bold text-sky-400 hover:underline tracking-widest uppercase mt-4"
                                >
                                    Try a different path
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* --- FOOTER --- */}
            {!hasTyped && (
                <footer className="w-full bg-black/40 backdrop-blur-md border-t border-white/5 py-8 text-center text-[10px] text-slate-600 font-bold tracking-[0.3em] uppercase z-10">
                    <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex gap-8">
                            <span className="hover:text-sky-400 cursor-pointer transition-colors">Vision</span>
                            <span className="hover:text-sky-400 cursor-pointer transition-colors">Privacy</span>
                            <span className="hover:text-sky-400 cursor-pointer transition-colors">Archive</span>
                        </div>
                        <div className="text-slate-500">
                            Empowering Faith through AI Intelligence
                        </div>
                        <div>
                            &copy; 2026 DailyMannaAI
                        </div>
                    </div>
                </footer>
            )}
        </div>
    );
}
