"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Book, Newspaper, Sparkles, Send, ArrowRight, MessageCircle, X } from "lucide-react";
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
        <div className="min-h-screen bg-white text-[#202124] relative flex flex-col items-center selection:bg-[#4285f4]/20 border-t-4 border-[#4285f4]">
            {/* --- HEADER --- */}
            <header className={`w-full max-w-7xl px-4 md:px-8 py-4 flex items-center justify-between z-10 ${hasTyped ? 'border-b border-gray-100' : ''}`}>
                <div className="flex items-center gap-6">
                    {hasTyped && (
                        <div
                            className="flex items-center gap-1 cursor-pointer"
                            onClick={() => { setHasTyped(false); setQuery(""); setResults([]); }}
                        >
                            <span className="font-['Cinzel'] text-xl font-bold tracking-tight text-[#202124]">
                                Daily<span className="text-[#4285f4]">Manna</span>AI
                            </span>
                        </div>
                    )}
                    <div className="hidden md:block font-sans text-gray-400 text-xs tracking-wide uppercase font-bold">
                        Christian Search Engine
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/notebook" className="flex items-center gap-2 bg-[#f8f9fa] hover:bg-[#f1f3f4] border border-[#dadce0] px-4 py-2 rounded-lg text-sm font-medium text-[#3c4043] transition-all">
                        <MessageCircle size={14} className="text-[#4285f4]" />
                        Notebook Workspace
                    </Link>
                </div>
            </header>

            {/* --- MAIN CONTENT --- */}
            <main className={`flex-1 w-full flex flex-col items-center transition-all duration-500 z-10 ${hasTyped ? 'pt-4' : 'pt-24'}`}>

                {/* Brand & Hero (Hides when results show) */}
                <div className={`text-center space-y-8 mb-8 transition-all duration-500 overflow-hidden ${hasTyped ? 'hidden' : 'block'}`}>
                    <div className="flex justify-center items-center gap-2 mb-2">
                        <h1 className="font-['Cinzel'] text-6xl md:text-8xl font-black tracking-tighter text-[#202124]">
                            Daily<span className="text-[#4285f4]">Manna</span>AI
                        </h1>
                    </div>
                    <p className="font-sans text-xl text-gray-500">
                        Search the Scriptures and Christian News with AI
                    </p>

                    {/* Simple Daily Verse */}
                    <div className="mt-8 mx-auto max-w-xl text-center px-4">
                        <p className="text-gray-500 italic text-sm leading-relaxed">
                            "{dailyVerse.text}"
                        </p>
                        <div className="text-[11px] font-bold text-[#4285f4] mt-2 tracking-widest">— {dailyVerse.ref}</div>
                    </div>
                </div>

                {/* --- SEARCH BOX --- */}
                <div className={`w-full transition-all duration-500 flex flex-col items-center ${hasTyped ? 'max-w-7xl px-4 md:px-8' : 'max-w-2xl px-6'}`}>
                    <form
                        onSubmit={handleSearch}
                        className={`w-full flex items-center gap-4 ${hasTyped ? 'flex-col md:flex-row md:items-center' : 'flex-col'}`}
                    >
                        <div className={`relative group w-full ${hasTyped ? 'md:max-w-3xl' : ''}`}>
                            <div className="relative bg-white border border-[#dadce0] rounded-full px-5 py-0.5 flex items-center transition-all focus-within:shadow-[0_1px_6px_rgba(32,33,36,0.28)] hover:shadow-[0_1px_6px_rgba(32,33,36,.28)] focus-within:border-transparent group-hover:border-transparent">
                                <Search className="text-[#9aa0a6] w-5 h-5 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search the Word..."
                                    className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-base text-[#202124] placeholder:text-[#9aa0a6]"
                                />
                                {query && (
                                    <button
                                        type="button"
                                        onClick={() => setQuery("")}
                                        className="p-1 hover:bg-gray-100 rounded-full"
                                    >
                                        <X size={18} className="text-[#70757a]" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {!hasTyped && (
                            <div className="flex gap-3 mt-4">
                                <button
                                    type="submit"
                                    className="bg-[#f8f9fa] border border-transparent hover:border-[#dadce0] hover:shadow-sm px-6 py-2 rounded text-sm text-[#3c4043] transition-all font-sans"
                                >
                                    Daily Search
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSearch(undefined, 'bible')}
                                    className="bg-[#f8f9fa] border border-transparent hover:border-[#dadce0] hover:shadow-sm px-6 py-2 rounded text-sm text-[#3c4043] transition-all font-sans"
                                >
                                    I'm Feeling Spiritual
                                </button>
                            </div>
                        )}

                        {hasTyped && (
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 w-full md:w-auto">
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
                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all text-sm whitespace-nowrap ${filter === btn.id
                                            ? 'bg-blue-50 border-blue-500 text-blue-600 font-medium'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {btn.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </form>
                </div>

                {/* --- RESULTS SECTION --- */}
                {hasTyped && (
                    <div className="w-full max-w-7xl px-4 md:px-8 mt-4 pb-20">
                        {isSearching ? (
                            <div className="py-20 flex flex-col items-center gap-4">
                                <div className="w-8 h-8 border-4 border-[#4285f4] border-t-transparent rounded-full animate-spin" />
                                <div className="text-gray-400 text-sm italic">Searching archives...</div>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="text-sm text-gray-500 pt-2 mb-2">
                                        About {results.length} results for <span className="font-bold">"{query}"</span>
                                    </div>

                                    <div className="space-y-10">
                                        {results.map((res, i) => (
                                            <div key={i} className="group max-w-2xl">
                                                {filter === 'bible' ? (
                                                    <div className="space-y-1">
                                                        <div className="text-xs text-[#202124] mb-1 font-sans">
                                                            <span className="text-gray-400">BIBLE ✝</span> {res.title}
                                                        </div>
                                                        <h3 className="text-xl md:text-2xl text-[#1a0dab] hover:underline cursor-pointer font-sans leading-tight">
                                                            {res.title}: {res.description.substring(0, 40)}...
                                                        </h3>
                                                        <p className="text-[#4d5156] text-[15px] leading-relaxed font-sans">
                                                            "{res.description}"
                                                        </p>
                                                        <div className="pt-2 flex items-center gap-2 text-xs text-blue-600 font-bold uppercase tracking-tighter cursor-pointer hover:bg-blue-50 w-fit px-2 py-1 rounded">
                                                            King James Version (KJV)
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-xs text-[#202124] mb-1 truncate font-sans">
                                                            {res.link ? (
                                                                <span className="text-gray-400">{res.source || res.link.split('/')[2]}</span>
                                                            ) : (
                                                                <span className="text-gray-400">{res.source || "Content Source"}</span>
                                                            )}
                                                            {res.grace_rank && res.grace_rank > 0.8 && (
                                                                <span className="flex items-center gap-0.5 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-sm font-bold text-[9px] uppercase tracking-wide">
                                                                    <Sparkles size={8} /> Verified Ministry
                                                                </span>
                                                            )}
                                                        </div>
                                                        <a
                                                            href={res.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block"
                                                        >
                                                            <h3 className="text-xl text-[#1a0dab] hover:underline cursor-pointer font-sans leading-tight">
                                                                {res.title}
                                                            </h3>
                                                        </a>
                                                        <p className="text-[#4d5156] text-[15px] leading-relaxed font-sans line-clamp-2">
                                                            {res.description}
                                                        </p>
                                                        {res.bible_refs && res.bible_refs.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {res.bible_refs.map((ref, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        onClick={() => {
                                                                            setFilter('bible');
                                                                            setQuery(ref);
                                                                            handleSearch(undefined, 'bible');
                                                                        }}
                                                                        className="text-[10px] font-bold text-[#4285f4] bg-[#4285f4]/5 hover:bg-[#4285f4]/10 px-2 py-0.5 rounded-full cursor-pointer transition-colors flex items-center gap-1"
                                                                    >
                                                                        <Book size={10} /> {ref}
                                                                    </span>
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
                                <div className="hidden lg:block space-y-6">
                                    <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
                                        <div className="font-['Cinzel'] text-xs font-bold text-[#4285f4] tracking-widest mb-4 uppercase">Topic Essence</div>
                                        <h2 className="text-2xl font-sans font-bold text-[#202124] mb-4 capitalise">{query}</h2>
                                        <div className="text-sm text-gray-600 leading-relaxed font-sans mb-6">
                                            Exploring the theological and scriptural context of <span className="italic">"{query}"</span> through the lens of scripture.
                                        </div>
                                        <div className="pt-6 border-t border-gray-100">
                                            <div className="text-xs font-bold text-gray-400 uppercase mb-3">Related Passages</div>
                                            <div className="space-y-4">
                                                {results.slice(0, 3).map((r, idx) => (
                                                    <div key={idx} className="flex gap-3 items-start group cursor-pointer">
                                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0 group-hover:scale-125 transition-all" />
                                                        <span className="text-xs font-bold text-blue-600 hover:underline">{r.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20 opacity-50 space-y-4">
                                <div className="text-4xl text-gray-300">🕊️</div>
                                <div className="text-gray-500 font-sans">No results found in the archives.</div>
                                <div className="text-xs text-gray-400 font-sans">Try broader keywords or verify spelling.</div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* --- FOOTER --- */}
            {!hasTyped && (
                <footer className="w-full bg-[#f2f2f2] border-t border-gray-200 py-4 text-center text-sm text-[#70757a] z-10">
                    <div className="max-w-7xl mx-auto px-8 flex justify-center gap-8">
                        <span className="hover:underline cursor-pointer">About DailyMannaAI</span>
                        <span className="hover:underline cursor-pointer">Privacy</span>
                        <span className="hover:underline cursor-pointer">Terms</span>
                        <span className="hover:underline cursor-pointer">Community</span>
                    </div>
                </footer>
            )}
        </div>
    );
}
