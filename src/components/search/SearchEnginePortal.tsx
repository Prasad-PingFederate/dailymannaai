"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Book, Newspaper, Sparkles, Send, ArrowRight, MessageCircle } from "lucide-react";
import Link from "next/link";

interface SearchResult {
    title: string;
    description: string;
    link?: string;
    source?: string;
}

export default function SearchEnginePortal() {
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<"bible" | "news" | "devotionals" | "sermons">("bible");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasTyped, setHasTyped] = useState(false);
    const [dailyVerse, setDailyVerse] = useState({ ref: "John 3:16", text: "For God so loved the world that He gave His one and only Son..." });

    const handleSearch = async (e?: React.FormEvent, currentType?: string) => {
        if (e) e.preventDefault();
        const searchQuery = query.trim();
        if (!searchQuery) return;

        const searchType = currentType || filter;

        setIsSearching(true);
        setHasTyped(true);
        setResults([]); // Clear previous results
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`);
            const data = await res.json();
            if (res.ok && data.results) {
                setResults(data.results);
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
        <div className="min-h-screen bg-[#0D1B2A] text-white relative flex flex-col items-center selection:bg-gold/30">
            {/* --- ANIMATED BACKGROUND (Twinkling Stars) --- */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_10%,rgba(30,77,140,0.5)_0%,transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_90%,rgba(201,150,43,0.15)_0%,transparent_60%)]" />
                {[...Array(50)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white/70 rounded-full animate-pulse-slow"
                        style={{
                            width: `${Math.random() * 2 + 1}px`,
                            height: `${Math.random() * 2 + 1}px`,
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${Math.random() * 3 + 2}s`
                        }}
                    />
                ))}
            </div>

            {/* --- CROSS WATERMARK --- */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.02] pointer-events-none z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40px] h-[400px] bg-gold" />
                <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[40px] bg-gold" />
            </div>

            {/* --- HEADER --- */}
            <header className="w-full max-w-7xl px-8 py-6 flex items-center justify-between border-b border-gold/10 z-10">
                <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-9 bg-gradient-to-b from-gold-light to-gold rounded-sm" />
                        <div className="absolute top-[32%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-2 bg-gradient-to-r from-gold to-gold-light rounded-sm" />
                    </div>
                    <span className="font-['Cinzel'] text-xl font-bold tracking-wide">
                        Daily<span className="text-gold-light">Manna</span>AI
                    </span>
                </div>
                <div className="hidden md:block font-['Crimson_Pro'] italic text-white/50 text-sm max-w-[340px] text-right leading-tight">
                    "Your word is a lamp to my feet and a light to my path." — Psalm 119:105
                </div>
                <Link href="/notebook" className="flex items-center gap-2 bg-gold/10 hover:bg-gold/20 border border-gold/30 px-4 py-2 rounded-full text-xs font-bold text-gold-light transition-all active:scale-95">
                    <MessageCircle size={14} />
                    Notebook Workspace
                </Link>
            </header>

            {/* --- MAIN CONTENT --- */}
            <main className={`flex-1 w-full max-w-4xl px-6 flex flex-col items-center transition-all duration-700 z-10 ${hasTyped ? 'pt-8' : 'pt-32'}`}>

                {/* Brand & Hero (Hides when results show) */}
                <div className={`text-center space-y-4 mb-10 transition-all duration-500 overflow-hidden ${hasTyped ? 'max-h-0 opacity-0 mb-0' : 'max-h-[300px]'}`}>
                    <div className="inline-block relative w-12 h-14 mb-4">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-14 bg-gradient-to-b from-gold-light to-gold rounded-sm shadow-[0_0_20px_rgba(201,150,43,0.3)]" />
                        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-2.5 bg-gradient-to-r from-gold to-gold-light rounded-sm shadow-[0_0_20px_rgba(201,150,43,0.3)]" />
                    </div>
                    <h1 className="font-['Cinzel'] text-5xl md:text-6xl font-black tracking-widest text-white drop-shadow-[0_0_40px_rgba(201,150,43,0.3)]">
                        Daily<span className="text-gold-light">Manna</span>AI
                    </h1>
                    <p className="font-['Crimson_Pro'] text-lg italic text-gold-pale/70">
                        Seek and you shall find — Christian search, powered by faith
                    </p>

                    {/* Today's Manna Banner */}
                    <div className="mt-12 mx-auto max-w-2xl bg-gold/5 border border-gold/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
                        <div className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase mb-3 text-center">✦ Today's Manna ✦</div>
                        <p className="font-['Crimson_Pro'] text-lg italic text-gold-pale leading-relaxed text-center">
                            "{dailyVerse.text}"
                        </p>
                        <div className="font-['Cinzel'] text-[11px] text-gold mt-3 tracking-widest text-center">— {dailyVerse.ref}</div>
                    </div>
                </div>

                {/* --- SEARCH BOX --- */}
                <form onSubmit={handleSearch} className="w-full flex flex-col items-center gap-6">
                    <div className="w-full relative group">
                        <div className="relative bg-white/5 backdrop-blur-xl border-1.5 border-gold/30 rounded-[3rem] p-2 flex items-center transition-all focus-within:border-gold focus-within:bg-white/10 focus-within:shadow-[0_0_40px_rgba(201,150,43,0.15)] group-hover:border-gold/50">
                            <Search className="ml-5 text-gold w-5 h-5 flex-shrink-0" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search Scripture, sermons, news..."
                                className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-lg font-light placeholder:text-white/20"
                            />
                            <button
                                type="submit"
                                className="bg-gradient-to-br from-gold to-gold-light rounded-full px-8 py-3.5 text-navy font-['Cinzel'] font-bold text-sm tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-gold/20"
                            >
                                Search
                            </button>
                        </div>
                    </div>

                    {/* --- FILTER CHIPS --- */}
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                        <span className="text-[11px] font-bold tracking-widest text-white/30 uppercase mr-2">Filters:</span>
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
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all text-sm ${filter === btn.id
                                    ? 'bg-gold/20 border-gold text-gold-light font-medium shadow-[0_0_15px_rgba(201,150,43,0.1)]'
                                    : 'bg-white/5 border-white/10 text-white/50 hover:border-gold/50 hover:text-gold-pale hover:bg-gold/5'
                                    }`}
                            >
                                {btn.icon}
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </form>

                {/* --- RESULTS SECTION --- */}
                {hasTyped && (
                    <div className="w-full mt-12 space-y-6 pb-20">
                        {isSearching ? (
                            <div className="text-center py-20 space-y-4">
                                <div className="inline-block relative w-8 h-10 animate-pulse">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-10 bg-gold rounded-sm" />
                                    <div className="absolute top-[32%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-1.5 bg-gold rounded-sm" />
                                </div>
                                <div className="font-['Crimson_Pro'] italic text-gold-pale text-lg opacity-70">Searching the Scriptures...</div>
                            </div>
                        ) : results.length > 0 ? (
                            <>
                                <div className="text-sm text-white/40 border-b border-white/5 pb-4 mb-6">
                                    <span className="text-gold font-bold">✝</span> Found {results.length} results for "<span className="text-gold-light italic">{query}</span>" in <span className="uppercase tracking-widest text-[11px] font-bold text-white/60">{filter}</span>
                                </div>

                                <div className="grid gap-4">
                                    {results.map((res, i) => (
                                        filter === 'bible' ? (
                                            <div key={i} className="group bg-white/3 border border-gold/20 rounded-2xl p-7 relative transition-all hover:bg-white/5 hover:translate-x-1 border-l-4 border-l-gold">
                                                <div className="font-['Cinzel'] text-xs font-bold text-gold tracking-widest mb-3 flex items-center gap-2">
                                                    <span>✝</span> {res.title}
                                                </div>
                                                <p className="font-['Crimson_Pro'] text-xl italic text-gold-pale/90 leading-relaxed">
                                                    "{res.description}"
                                                </p>
                                                <div className="mt-4 text-[10px] text-white/30 tracking-widest uppercase">
                                                    King James Version (KJV)
                                                </div>
                                            </div>
                                        ) : (
                                            <a
                                                key={i}
                                                href={res.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group block bg-white/3 border border-white/10 rounded-2xl p-6 transition-all hover:bg-royal/10 hover:border-royal/50 hover:-translate-y-1 shadow-lg"
                                            >
                                                <div className="flex items-center justify-between mb-3 text-xs">
                                                    <span className="bg-royal/30 border border-royal/50 px-3 py-1 rounded-full text-blue-300 font-bold uppercase tracking-tighter">{res.source || 'Christian Content'}</span>
                                                </div>
                                                <h3 className="font-['Crimson_Pro'] text-xl font-bold text-white mb-2 group-hover:text-gold-pale transition-colors">{res.title}</h3>
                                                <p className="text-sm text-white/50 line-clamp-2 leading-relaxed">{res.description}</p>
                                                <div className="flex items-center gap-2 mt-4 text-[11px] text-blue-400 font-bold uppercase tracking-widest">
                                                    Visit Source <ArrowRight size={10} />
                                                </div>
                                            </a>
                                        )
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-20 opacity-50 space-y-4">
                                <div className="text-4xl">🕊️</div>
                                <div className="font-['Cinzel'] text-lg">No findings in the word</div>
                                <div className="font-['Crimson_Pro'] italic">Try different keywords or check your spelling</div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* --- FOOTER --- */}
            <footer className="w-full border-t border-gold/10 py-8 text-center text-xs text-white/20 font-['Crimson_Pro'] italic mt-auto z-10">
                ✝ DailyMannaAI.com — A Ministry of the Word &nbsp;|&nbsp;
                <span className="mx-2 hover:text-gold transition-colors cursor-pointer">About</span> ·
                <span className="mx-2 hover:text-gold transition-colors cursor-pointer">Prayer Wall</span> ·
                <span className="mx-2 hover:text-gold transition-colors cursor-pointer">Terms</span>
            </footer>
        </div>
    );
}
