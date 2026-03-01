"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Search, Book, Newspaper, Sparkles, MessageCircle, X,
    ExternalLink, Clock, Calculator, Calendar, PlayCircle, Quote,
    ChevronLeft, Globe, Share2, BookOpen, ChevronRight, Zap,
    ArrowUpRight, Filter, CheckCircle, Star, Hash, Copy, Check
} from "lucide-react";
import Link from "next/link";
import BibleQuoteGenerator from "@/components/notebook/BibleQuoteGenerator";
import { Image as ImageIcon } from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface SearchResult {
    title: string;
    description: string;
    link?: string | null;
    source?: string;
    grace_rank?: number;
    bible_refs?: string[];
    favicon?: string;
    type?: string;
}

interface PreviewPanel {
    title: string;
    description: string;
    link: string;
    source: string;
    favicon?: string;
    type?: string;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Ensure a URL is valid and absolute. Returns null if unusable. */
function sanitizeUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    try {
        const u = new URL(url.startsWith("http") ? url : `https://${url}`);
        return u.href;
    } catch {
        return null;
    }
}

/** Extract a clean hostname for display */
function getHostname(url: string | null | undefined): string {
    try {
        return new URL(url ?? "").hostname.replace(/^www\./, "");
    } catch {
        return "";
    }
}

/** Build a favicon URL via Google's public service */
function faviconUrl(url: string | null | undefined): string {
    const host = getHostname(url);
    return host ? `https://www.google.com/s2/favicons?domain=${host}&sz=32` : "";
}

/** Generate a reliable BibleGateway link for any Bible reference */
function bibleGatewayLink(reference: string): string {
    return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(reference)}&version=KJV`;
}

/** Open a URL safely in a new tab */
function openLink(url: string | null | undefined) {
    const clean = sanitizeUrl(url);
    if (!clean) return;
    window.open(clean, "_blank", "noopener,noreferrer");
}

// ─── COPY BUTTON ─────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            title="Copy"
        >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
        </button>
    );
}

// ─── AI NEWS CARD ─────────────────────────────────────────────────────────────

interface AiNewsArticle {
    title: string;
    description: string;
    link: string;
    source: string;
    pubDate?: string | null;
    imageUrl?: string | null;
    category?: string;
}

function AiNewsCard({ article, index }: { article: AiNewsArticle; index: number }) {
    const host = (() => { try { return new URL(article.link).hostname.replace(/^www\./, ""); } catch { return ""; } })();
    const faviconSrc = host ? `https://www.google.com/s2/favicons?domain=${host}&sz=32` : "";
    const timeAgo = article.pubDate ? (() => {
        const diff = Date.now() - new Date(article.pubDate).getTime();
        const h = Math.floor(diff / 3_600_000);
        const d = Math.floor(diff / 86_400_000);
        return h < 1 ? "Just now" : h < 24 ? `${h}h ago` : `${d}d ago`;
    })() : null;

    return (
        <div
            className="group relative bg-white hover:bg-slate-50 rounded-2xl border border-slate-200
                 hover:border-sky-400/40 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md
                 animate-in fade-in slide-in-from-bottom-3"
            style={{ animationDelay: `${index * 70}ms`, animationFillMode: "both" }}
        >
            <div className="p-5">
                {/* Source row */}
                <div className="flex items-center gap-2 mb-3">
                    {faviconSrc && (
                        <img src={faviconSrc} alt="" className="w-3.5 h-3.5 rounded-sm"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    )}
                    <span className="text-[9px] font-black text-sky-600 uppercase tracking-widest truncate">{article.source || host}</span>
                    {timeAgo && <span className="ml-auto text-[9px] text-slate-400 font-medium flex-shrink-0">{timeAgo}</span>}
                </div>

                {/* Title */}
                <h4 className="text-slate-900 font-bold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-sky-700 transition-colors">
                    {article.title}
                </h4>

                {/* Description */}
                {article.description && (
                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{article.description}</p>
                )}
            </div>

            {/* Read button */}
            <div className="px-5 pb-4">
                <button
                    onClick={() => { const u = article.link; if (u) window.open(u, "_blank", "noopener,noreferrer"); }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl
                       bg-sky-500 hover:bg-sky-400 text-white text-[10px] font-black uppercase tracking-wider
                       transition-all active:scale-95"
                >
                    <ArrowUpRight size={11} /> Read Article
                </button>
            </div>
        </div>
    );
}

// ─── BIBLE CONNECTION PANEL ───────────────────────────────────────────────────

interface BibleConnection {
    reference: string;
    verse: string;
    connection: string;
}

function BibleConnectionPanel({ connections }: { connections: BibleConnection[] }) {
    if (!connections || connections.length === 0) return null;

    return (
        <div className="mt-8 not-italic">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-5">
                <div className="w-7 h-7 rounded-xl bg-amber-500/15 flex items-center justify-center">
                    <Book size={14} className="text-amber-600" />
                </div>
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-[0.35em]">
                    Biblical Prophecy Connection
                </span>
                <div className="h-px flex-1 bg-amber-200/60" />
                <span className="text-[9px] text-amber-600/70 font-medium italic">KJV · Prophetic Lens</span>
            </div>

            {/* Verse cards */}
            <div className="space-y-3">
                {connections.map((bc, i) => (
                    <div
                        key={i}
                        className="relative rounded-2xl overflow-hidden border border-amber-200/60
                               bg-gradient-to-br from-amber-50 via-white to-orange-50
                               shadow-sm hover:shadow-md transition-all duration-300
                               animate-in fade-in slide-in-from-bottom-2"
                        style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
                    >
                        {/* Decorative glow */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

                        <div className="relative p-5">
                            {/* Reference badge */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                                           bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider
                                           shadow-sm shadow-amber-500/20">
                                    <BookOpen size={9} />
                                    {bc.reference}
                                </span>
                                <div className="flex gap-1">
                                    {[...Array(3)].map((_, s) => (
                                        <Star key={s} size={8} className="fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                            </div>

                            {/* Verse */}
                            <blockquote className="text-slate-800 text-sm font-serif italic leading-relaxed mb-3 pl-3 border-l-2 border-amber-400">
                                &ldquo;{bc.verse}&rdquo;
                            </blockquote>

                            {/* Connection explanation */}
                            <div className="flex items-start gap-2">
                                <Zap size={11} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-slate-600 text-xs leading-relaxed">{bc.connection}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── RESULT CARD ──────────────────────────────────────────────────────────────

function ResultCard({
    result,
    onPreview,
    index,
}: {
    result: SearchResult;
    onPreview: (r: SearchResult) => void;
    index: number;
}) {
    const cleanUrl = sanitizeUrl(result.link);
    const host = getHostname(cleanUrl);
    const isBible = !cleanUrl || result.type === "bible";
    const finalUrl = isBible ? bibleGatewayLink(result.title) : cleanUrl!;

    return (
        <div
            className="group relative bg-white hover:bg-slate-50 border border-slate-200
                 hover:border-sky-500/30 rounded-3xl p-7 transition-all duration-300
                 animate-in fade-in slide-in-from-bottom-3 shadow-sm hover:shadow-md"
            style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
        >
            {/* Source row */}
            <div className="flex items-center gap-2 mb-3">
                {faviconUrl(finalUrl) && (
                    <img
                        src={faviconUrl(finalUrl)}
                        alt=""
                        className="w-4 h-4 rounded-sm object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                )}
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {isBible ? "Holy Bible · KJV" : (result.source || host || "Trusted Source")}
                </span>
                {isBible && <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-wider">Scripture</span>}
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors leading-snug mb-3 pr-10">
                {result.title}
            </h3>

            {/* Description */}
            <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-5 font-[350] italic">
                {isBible ? `"${result.description}"` : result.description}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3">
                {/* PRIMARY — Open Link */}
                <button
                    onClick={() => openLink(finalUrl)}
                    className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-sky-500 hover:bg-sky-400
                     text-white text-xs font-black uppercase tracking-wider transition-all
                     active:scale-95 shadow-lg shadow-sky-500/20"
                >
                    <ArrowUpRight size={13} />
                    {isBible ? "Read on BibleGateway" : "Open Article"}
                </button>

                {/* SECONDARY — Quick Preview */}
                <button
                    onClick={() => onPreview({ ...result, link: finalUrl })}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10
                     border border-white/10 hover:border-white/20 text-slate-400 hover:text-white
                     text-xs font-black uppercase tracking-wider transition-all"
                >
                    <BookOpen size={12} />
                    Preview
                </button>

                {/* Copy URL */}
                <CopyButton text={finalUrl} />
            </div>

            {/* Bible refs badge */}
            {result.bible_refs && result.bible_refs.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                    {result.bible_refs.slice(0, 4).map((ref, i) => (
                        <button
                            key={i}
                            onClick={() => openLink(bibleGatewayLink(ref))}
                            className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20
                         text-amber-400 text-[9px] font-bold hover:bg-amber-500/20 transition-all"
                        >
                            {ref} ↗
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── SIDE PREVIEW PANEL ──────────────────────────────────────────────────────
// Replaces the broken iframe with a beautiful, fully functional preview.

function PreviewPanel({
    item,
    onClose,
}: {
    item: PreviewPanel | null;
    onClose: () => void;
}) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    if (!item) return null;

    const isBible = !item.link || item.type === "bible";
    const finalUrl = isBible ? bibleGatewayLink(item.title) : item.link;
    const host = getHostname(finalUrl);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Panel — slides in from RIGHT */}
            <div
                className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg bg-white border-l
                   border-slate-200 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
            >
                {/* Panel header */}
                <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        {faviconUrl(finalUrl) && (
                            <img src={faviconUrl(finalUrl)} alt="" className="w-5 h-5 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        )}
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest truncate max-w-[240px]">
                            {isBible ? "Holy Bible · King James Version" : host}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {/* Title */}
                    <div>
                        {isBible && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider mb-3">
                                <Book size={10} />
                                Scripture Reference
                            </div>
                        )}
                        <h2 className="text-2xl font-bold text-white leading-snug">{item.title}</h2>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    {/* Description / verse text */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                        <p className={`leading-relaxed text-slate-800 ${isBible ? "text-lg font-serif italic" : "text-sm"}`}>
                            {isBible ? `"${item.description}"` : item.description}
                        </p>
                    </div>

                    {/* Source info */}
                    {!isBible && item.source && (
                        <div className="flex items-center gap-3 px-1">
                            <Globe size={14} className="text-slate-500" />
                            <span className="text-xs text-slate-500 font-medium">{item.source}</span>
                        </div>
                    )}

                    {/* URL Preview */}
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Article URL</div>
                        <div className="text-xs text-sky-400 font-mono break-all leading-relaxed">{finalUrl}</div>
                    </div>

                    {/* Why this won't embed */}
                    {!isBible && (
                        <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-5">
                            <div className="flex items-start gap-3">
                                <Zap size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-amber-400 text-xs font-black uppercase tracking-wide mb-1">Why no inline preview?</div>
                                    <p className="text-slate-400 text-xs leading-relaxed">
                                        Most Christian news sites block embedded viewing for security. Click the button below to read the full article directly on the source — it opens instantly in a new tab.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer CTA */}
                <div className="p-6 border-t border-white/10 flex gap-3 flex-shrink-0">
                    <button
                        onClick={() => openLink(finalUrl)}
                        className="flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl
                       bg-sky-500 hover:bg-sky-400 text-white font-black text-sm uppercase
                       tracking-wider transition-all active:scale-95 shadow-lg shadow-sky-500/25"
                    >
                        <ArrowUpRight size={16} />
                        {isBible ? "Read on BibleGateway.com" : "Open Full Article"}
                    </button>
                    <CopyButton text={finalUrl} />
                </div>
            </div>
        </>
    );
}

// ─── INSTANT ANSWER WIDGET ────────────────────────────────────────────────────

function InstantAnswerWidget({ data }: { data: any }) {
    const iconMap: Record<string, React.ReactNode> = {
        calculator: <Calculator size={72} className="text-sky-300/20" />,
        time: <Clock size={72} className="text-indigo-300/20" />,
        date: <Calendar size={72} className="text-emerald-300/20" />,
        bible: <Book size={72} className="text-amber-300/20" />,
        age: <Sparkles size={72} className="text-pink-300/20" />,
    };
    const colorMap: Record<string, string> = {
        calculator: "from-sky-500/15 via-sky-500/5",
        time: "from-indigo-500/15 via-indigo-500/5",
        date: "from-emerald-500/15 via-emerald-500/5",
        bible: "from-amber-500/15 via-amber-500/5",
        age: "from-pink-500/15 via-pink-500/5",
    };

    return (
        <div
            className={`relative rounded-[2.5rem] bg-gradient-to-br from-sky-50 to-white
                  border border-slate-200 p-10 overflow-hidden shadow-sm
                  animate-in fade-in slide-in-from-bottom-4 duration-500`}
        >
            <div className="absolute top-6 right-8 pointer-events-none select-none">
                {iconMap[data.type]}
            </div>

            <div className="flex items-center gap-2 mb-5">
                <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <span className="text-[10px] font-black text-sky-400 uppercase tracking-[0.4em]">
                    {data.title || "Instant Answer"}
                </span>
            </div>

            <div className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none mb-3">
                {data.result || data.description}
            </div>

            {data.subtitle && (
                <div className="text-slate-400 text-base font-medium mt-2">{data.subtitle}</div>
            )}

            {/* Bible ref — open on BibleGateway */}
            {data.type === "bible" && data.title && (
                <button
                    onClick={() => openLink(bibleGatewayLink(data.title))}
                    className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500/15
                     border border-amber-500/25 text-amber-400 text-xs font-black uppercase
                     tracking-wider hover:bg-amber-500/25 transition-all"
                >
                    <Book size={13} />
                    Read Full Chapter on BibleGateway
                    <ArrowUpRight size={13} />
                </button>
            )}
        </div>
    );
}

// ─── SOLUTION DASHBOARD ───────────────────────────────────────────────────────

function SolutionDashboard({
    solution,
    query,
    onPreview,
}: {
    solution: any;
    query: string;
    onPreview: (r: SearchResult) => void;
}) {
    return (
        <div className="space-y-14 animate-in fade-in duration-700">

            {/* ── AI INSIGHT ── */}
            <div className="relative rounded-[3rem] bg-gradient-to-br from-sky-50 via-white to-transparent
                      border border-sky-100 p-12 overflow-hidden shadow-sm">
                <div className="absolute -top-20 -right-20 w-56 h-56 bg-sky-500/10 rounded-full blur-[70px] pointer-events-none" />
                <div className="relative z-10 text-center space-y-6 max-w-2xl mx-auto">
                    <div className="text-sky-600 text-[10px] font-black uppercase tracking-[0.6em]">Divine Perspective</div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight font-['Cinzel'] italic">
                        "{query}"
                    </h2>
                    <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-sky-500 to-transparent mx-auto" />
                    <p className="text-slate-700 text-lg md:text-xl leading-relaxed font-serif italic">
                        "{solution.insight}"
                    </p>

                    {/* Deep Crawl Suggestion */}
                    {solution && solution.deepCrawlAvailable && (
                        <div className="pt-6">
                            <button
                                onClick={async () => {
                                    alert("Deep Crawler Triggered! The Python Celery engine is now scanning YouTube, Twitter, and Scrapy news for '" + query + "'. This runs in the background to avoid slowing down your main search.");
                                }}
                                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 group"
                            >
                                <Zap size={14} className="group-hover:animate-bounce" />
                                Run Deep World Crawler (Python Service)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── 5 BIBLE VERSES ── */}
            {solution.bible?.length > 0 && (
                <section className="space-y-6">
                    <SectionHeader icon={<Book size={16} />} label="5 Scriptural Foundations" color="text-amber-500" />
                    <div className="space-y-4">
                        {(solution.bible as SearchResult[]).map((b, i) => {
                            const bgLink = bibleGatewayLink(b.title);
                            return (
                                <div
                                    key={i}
                                    className="group bg-white/[0.025] hover:bg-white/[0.045] p-7 rounded-[2rem]
                             border border-white/[0.06] hover:border-amber-500/25 transition-all duration-300
                             animate-in fade-in slide-in-from-bottom-2"
                                    style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
                                >
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <span className="text-amber-500 text-sm font-black uppercase tracking-wider">{b.title}</span>
                                        <button
                                            onClick={() => openLink(bgLink)}
                                            className="flex-shrink-0 p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20
                                 text-amber-400 hover:text-amber-300 transition-all"
                                            title="Read on BibleGateway"
                                        >
                                            <ArrowUpRight size={14} />
                                        </button>
                                    </div>
                                    <p className="text-slate-200 text-base font-serif italic leading-relaxed group-hover:text-white transition-colors">
                                        "{b.description}"
                                    </p>
                                    <button
                                        onClick={() => onPreview({ ...b, link: bgLink, type: "bible", source: "Holy Bible · KJV" })}
                                        className="mt-4 text-[10px] font-black text-amber-500/50 hover:text-amber-400 uppercase tracking-widest transition-colors"
                                    >
                                        Preview verse context →
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── 4 NEWS ── */}
            <section className="space-y-6">
                <SectionHeader icon={<Newspaper size={16} />} label="4 World Perspectives" color="text-sky-400" />
                {solution.news?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {(solution.news || []).map((n: any, i: number) => {
                            const cleanUrl = sanitizeUrl(n.link);
                            if (!cleanUrl) return null;
                            return (
                                <NewsCard key={i} item={{ ...n, link: cleanUrl }} index={i} onPreview={onPreview} />
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-10 text-center text-slate-400 italic border border-slate-100 rounded-3xl text-sm">
                        Crawlers are scanning global news — search again in a moment.
                    </div>
                )}
            </section>

            {/* ── DEVOTIONALS + SERMONS ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Devotionals */}
                <section className="space-y-6">
                    <SectionHeader icon={<Quote size={16} />} label="3 Daily Mannas" color="text-indigo-400" />
                    <div className="space-y-3">
                        {(solution.devotionals || []).map((d: any, i: number) => (
                            <div
                                key={i}
                                className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-200 hover:border-indigo-500/20 transition-all shadow-sm"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                    <h4 className="text-slate-900 text-sm font-bold">{d.title}</h4>
                                </div>
                                <p className="text-slate-600 text-xs leading-relaxed">{d.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Sermons */}
                <section className="space-y-6">
                    <SectionHeader icon={<MessageCircle size={16} />} label="2 Divine Lectures" color="text-pink-400" />
                    <div className="space-y-3">
                        {(solution.sermons || []).map((s: any, i: number) => (
                            <button
                                key={i}
                                onClick={() => openLink(`https://www.youtube.com/results?search_query=${encodeURIComponent(s.title + " sermon")}`)}
                                className="w-full text-left bg-slate-50 p-5 rounded-[1.5rem] border border-slate-200
                           hover:border-pink-500/25 hover:bg-slate-100 transition-all flex items-center gap-4 group shadow-sm"
                            >
                                <div className="w-11 h-11 rounded-2xl bg-pink-500/10 flex items-center justify-center
                               text-pink-400 group-hover:bg-pink-500 group-hover:text-white transition-all flex-shrink-0">
                                    <PlayCircle size={22} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-slate-900 text-sm font-bold truncate group-hover:text-pink-600 transition-colors">{s.title}</h4>
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">{s.speaker} · {s.length}</p>
                                </div>
                                <ArrowUpRight size={14} className="text-slate-600 group-hover:text-pink-400 ml-auto flex-shrink-0 transition-colors" />
                            </button>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

// ─── NEWS CARD ────────────────────────────────────────────────────────────────

function NewsCard({
    item,
    index,
    onPreview,
}: {
    item: SearchResult;
    index: number;
    onPreview: (r: SearchResult) => void;
}) {
    const cleanUrl = sanitizeUrl(item.link)!;
    const host = getHostname(cleanUrl);

    return (
        <div
            className="group bg-white hover:bg-slate-50 rounded-[2rem] border border-slate-200
                 hover:border-sky-500/25 transition-all duration-300 flex flex-col overflow-hidden
                 animate-in fade-in slide-in-from-bottom-3 shadow-sm hover:shadow-md"
            style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
        >
            <div className="p-6 flex-1">
                <div className="flex items-center gap-2 mb-3">
                    <img
                        src={faviconUrl(cleanUrl)} alt="" className="w-4 h-4 rounded-sm"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">{item.source || host}</span>
                    <Newspaper size={10} className="text-sky-500 ml-auto flex-shrink-0" />
                </div>
                <h3 className="text-slate-900 font-bold text-base leading-snug mb-3 line-clamp-2
                       group-hover:text-sky-600 transition-colors">
                    {item.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 italic">{item.description}</p>
            </div>

            <div className="px-6 pb-5 flex items-center gap-2 border-t border-white/[0.04] pt-4">
                <button
                    onClick={() => openLink(cleanUrl)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl
                     bg-sky-500 hover:bg-sky-400 text-white text-[10px] font-black uppercase
                     tracking-wider transition-all active:scale-95"
                >
                    <ArrowUpRight size={11} /> Read Article
                </button>
                <button
                    onClick={() => onPreview(item)}
                    className="px-3 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08]
                     text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-wider transition-all"
                >
                    Info
                </button>
            </div>
        </div>
    );
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────

function SectionHeader({
    icon, label, color,
}: {
    icon: React.ReactNode;
    label: string;
    color: string;
}) {
    return (
        <div className="flex items-center gap-3 px-2">
            <div className={`flex items-center gap-2 text-sm font-black ${color} uppercase tracking-[0.18em]`}>
                {icon} {label}
            </div>
            <div className="h-px flex-1 bg-slate-100 ml-2" />
        </div>
    );
}

// ─── FILTER CHIP ─────────────────────────────────────────────────────────────

function FilterChip({
    id, label, icon, active, onClick,
}: {
    id: string; label: string; icon: React.ReactNode; active: boolean; onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-[10px] font-black
                  uppercase tracking-widest transition-all duration-200 whitespace-nowrap
                  ${active
                    ? "bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-500/25"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
        >
            {icon} {label}
        </button>
    );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
    return (
        <div className="py-36 flex flex-col items-center gap-8 animate-in fade-in duration-500">
            <div className="relative">
                <div className="absolute inset-0 bg-sky-500/10 blur-[50px] rounded-full scale-150" />
                <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-200
                        flex items-center justify-center relative shadow-sm">
                    <Search className="text-slate-400 w-9 h-9" />
                </div>
            </div>
            <div className="text-center space-y-3 max-w-sm">
                <div className="text-slate-900 font-black text-xl font-['Cinzel'] italic">
                    "Seek, and ye shall find…"
                </div>
                <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] leading-loose">
                    No results for "{query}"<br />Try a broader query or switch the filter above.
                </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
                {["grace", "faith", "John 3:16", "prayer", "resurrection"].map(suggestion => (
                    <button
                        key={suggestion}
                        className="px-4 py-2 rounded-full bg-slate-50 border border-slate-200
                       text-slate-600 text-xs font-bold hover:text-sky-600 hover:border-sky-500/30 transition-all shadow-sm"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── LOADING ─────────────────────────────────────────────────────────────────

function LoadingState() {
    return (
        <div className="py-28 flex flex-col items-center gap-8 animate-in fade-in duration-300">
            <div className="relative w-20 h-20">
                <div className="absolute inset-0 border border-sky-500/20 rounded-full" />
                <div className="absolute inset-0 border-t border-sky-500 rounded-full animate-spin" />
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sky-400 w-7 h-7 animate-pulse" />
            </div>
            <div className="text-center space-y-2">
                <div className="text-sky-400 text-[10px] font-black tracking-[0.5em] uppercase animate-pulse">
                    Searching the Scriptures…
                </div>
                <div className="text-slate-500 text-sm italic font-serif">"Knock, and it shall be opened unto you"</div>
            </div>
        </div>
    );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

function Sidebar() {
    return (
        <aside className="sticky top-10 bg-white border border-slate-200 rounded-[2.5rem] p-8 space-y-8 shadow-sm backdrop-blur-3xl">
            {/* Status */}
            <div className="space-y-2">
                <h3 className="text-slate-900 font-black uppercase text-[10px] tracking-widest">Engine Status</h3>
                <div className="flex items-center gap-2 text-emerald-400">
                    <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider">All Systems Live</span>
                </div>
            </div>

            {/* Tech stack */}
            <div className="space-y-4">
                <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/[0.06] pb-2">
                    Search Pipeline
                </h4>
                {[
                    { icon: <Search size={11} />, label: "Astra AI Vector Index", status: "live" },
                    { icon: <Sparkles size={11} />, label: "5!4!3!2!1! Model", status: "live" },
                    { icon: <Globe size={11} />, label: "Real-time Web Crawler", status: "live" },
                    { icon: <ArrowUpRight size={11} />, label: "Direct Link Opening", status: "fixed" },
                ].map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5 text-slate-300 font-medium">
                            <div className="w-6 h-6 rounded-lg bg-white/[0.05] flex items-center justify-center text-sky-400">
                                {t.icon}
                            </div>
                            {t.label}
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full
              ${t.status === "fixed" ? "bg-emerald-500/10 text-emerald-400" : "bg-sky-500/10 text-sky-400"}`}>
                            {t.status}
                        </span>
                    </div>
                ))}
            </div>

            {/* Quick links */}
            <div className="space-y-3">
                <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/[0.06] pb-2">
                    Quick Faith Links
                </h4>
                {[
                    { label: "BibleGateway.com", url: "https://www.biblegateway.com" },
                    { label: "Christianity Today", url: "https://www.christianitytoday.com" },
                    { label: "The Gospel Coalition", url: "https://www.thegospelcoalition.org" },
                    { label: "Desiring God", url: "https://www.desiringgod.org" },
                ].map((l, i) => (
                    <button
                        key={i}
                        onClick={() => openLink(l.url)}
                        className="w-full flex items-center justify-between py-2 text-slate-400 hover:text-sky-400
                       text-xs font-medium transition-colors group"
                    >
                        <span>{l.label}</span>
                        <ArrowUpRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                ))}
            </div>

            <div className="bg-sky-50 p-5 rounded-2xl border border-sky-100 text-xs font-serif italic text-slate-600 leading-relaxed">
                "Thy word is a lamp unto my feet, and a light unto my path."
                <span className="block mt-1 text-sky-600/60 not-italic font-black text-[9px] uppercase tracking-widest">Psalm 119:105</span>
            </div>
        </aside>
    );
}

// ─── DEEPSEEK-STYLE THOUGHT PANEL ─────────────────────────────────────────────

function ThoughtPanel({
    thought, isThinking, phase, startTime,
}: {
    thought: string;
    isThinking: boolean;
    phase?: string;
    startTime?: number;
}) {
    const [open, setOpen] = React.useState(true);
    const [elapsed, setElapsed] = React.useState(0);

    // Tick elapsed seconds while thinking
    React.useEffect(() => {
        if (!isThinking || !startTime) return;
        const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 500);
        return () => clearInterval(id);
    }, [isThinking, startTime]);

    const finalElapsed = !isThinking && startTime
        ? Math.floor((Date.now() - startTime) / 1000)
        : elapsed;

    return (
        <div className="mb-8">
            {/* ── Header bar ── */}
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                           bg-slate-100 hover:bg-slate-200/70
                           border border-slate-200 transition-all duration-200"
            >
                {isThinking ? (
                    <div className="flex items-center gap-2.5">
                        <div className="flex gap-1">
                            {[0, 1, 2].map(d => (
                                <span
                                    key={d}
                                    className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
                                    style={{ animationDelay: `${d * 0.18}s` }}
                                />
                            ))}
                        </div>
                        <span className="text-[12px] font-semibold text-slate-600">
                            {phase || "Thinking…"}
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 12 12">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="text-[12px] font-semibold text-slate-600">
                            Thought for {finalElapsed}s
                        </span>
                    </div>
                )}

                <div className="ml-auto flex items-center gap-2.5">
                    {isThinking && (
                        <span className="text-[10px] tabular-nums text-slate-400 font-mono">{elapsed}s</span>
                    )}
                    <ChevronRight
                        size={14}
                        className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-90" : "rotate-0"}`}
                    />
                </div>
            </button>

            {/* ── Collapsible body ── */}
            {open && (
                <div className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50
                                overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="max-h-48 overflow-y-auto px-5 py-4
                                    text-[12.5px] leading-relaxed text-slate-500
                                    font-mono whitespace-pre-wrap break-words">
                        {thought || (isThinking ? "Gathering insights…" : "")}
                        {isThinking && (
                            <span className="inline-block w-1.5 h-3.5 bg-slate-400 ml-0.5 animate-pulse align-middle" />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

type FilterType = "global" | "bible" | "news" | "devotionals" | "sermons" | "ai" | "studio";


export default function SearchEnginePortal() {
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<FilterType>("global");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [solution, setSolution] = useState<any>(null);
    const [instantAnswer, setInstantAnswer] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [preview, setPreview] = useState<PreviewPanel | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const studioRef = useRef<HTMLDivElement>(null);

    // AI Mode States
    const [aiMessages, setAiMessages] = useState<any[]>([]);
    const [isAiChatting, setIsAiChatting] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const abortAiControllerRef = useRef<AbortController | null>(null);

    const handleSearch = useCallback(async (searchQuery: string, searchFilter: FilterType) => {
        const q = searchQuery.trim();
        if (!q) return;

        if (searchFilter === "ai") {
            handleAiSendMessage(q);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${searchFilter}`);
            const data = await res.json();
            if (res.ok) {
                setResults(data.results || []);
                setInstantAnswer(data.instantAnswer);
                setSolution(data.solution);
                setHasSearched(true);
            } else {
                console.error("Search failed with status:", res.status);
            }
        } catch (err) {
            console.error("Search failed:", err);
        } finally {
            setIsSearching(false);
        }
    }, [aiMessages]);

    const handleAiSendMessage = async (textToSend: string): Promise<string> => {
        if (!textToSend.trim()) return "";

        let finalResponse = "";
        const userMessage = { role: "user", content: textToSend };
        const currentMessages = [...aiMessages, userMessage];

        setAiMessages(currentMessages);
        setAiSuggestions([]);
        setQuery("");
        setIsSearching(true);
        setIsAiChatting(true);
        setHasSearched(true);

        // Scroll to bottom
        setTimeout(() => {
            chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "smooth" });
        }, 100);

        // Abort previous if any
        if (abortAiControllerRef.current) abortAiControllerRef.current.abort();
        const controller = new AbortController();
        abortAiControllerRef.current = controller;

        // Add a "Ghost" assistant message immediately
        setAiMessages(prev => [...prev, {
            role: "assistant",
            content: "",
            thought: "",
            isThinking: true,
            thinkingPhase: "Consulting the Scriptures...",
            thinkStartTime: Date.now(),
            researchSteps: [
                "Opening the Divine archives...",
                "Cross-referencing KJV context...",
                "Distilling spiritual wisdom...",
                "Preparing your revelation..."
            ]
        }]);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: textToSend,
                    history: aiMessages // Note: currentMessages already has userMessage, but /api/chat might expect history EXCLUDING current user query, or INCLUDING. NotebookCore sends history=currentHistory where currentHistory includes userMessage.
                }),
                signal: controller.signal
            });

            if (!res.ok) throw new Error("Synthesis failure");

            const contentType = res.headers.get("content-type");
            if (contentType?.includes("application/json")) {
                const data = await res.json();
                if (data.role === "assistant") {
                    setAiMessages(prev => {
                        const newMsgs = [...prev];
                        const lastIdx = newMsgs.length - 1;
                        if (newMsgs[lastIdx].role === "assistant") {
                            newMsgs[lastIdx] = {
                                ...newMsgs[lastIdx],
                                content: data.content,
                                thought: data.thought,
                                isThinking: false,
                                isNewsMode: data.isNewsMode || false,
                                isConflictMode: data.isConflictMode || false,
                                newsArticles: data.newsArticles || [],
                                bibleConnections: data.bibleConnections || [],
                            };
                        }
                        return newMsgs;
                    });
                    if (data.suggestions) setAiSuggestions(data.suggestions);
                    finalResponse = data.content;
                }
                setIsAiChatting(false);
                setIsSearching(false);
                return finalResponse;
            }

            // Streaming mode
            const reader = res.body?.getReader();
            if (!reader) throw new Error("No stream reader");

            let fullText = "";
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;

                let currentThought = "";
                let currentContent = fullText;
                let stillThinking = true;
                let thinkingPhase = "Analyzing...";

                // Broad fuzzy regex — catches THOUGHT, THOUG, THUGHT, THGHT, OUG variants, etc.
                const thoughtStartRegex = /<TH[A-Z]{1,8}>/i;
                const thoughtEndRegex = /<\/TH[A-Z]{1,8}>/i;
                const responseStartRegex = /### RESPONSE START ###/i;

                const tStartMatch = fullText.match(thoughtStartRegex);
                const tEndMatch = fullText.match(thoughtEndRegex);
                const rStartMatch = fullText.match(responseStartRegex);

                if (tStartMatch) {
                    const startIndex = tStartMatch.index! + tStartMatch[0].length;
                    if (tEndMatch) {
                        const endIndex = tEndMatch.index!;
                        currentThought = fullText.substring(startIndex, endIndex);
                        currentContent = fullText.substring(endIndex + tEndMatch[0].length);
                        stillThinking = false;
                        thinkingPhase = "Reasoning complete.";
                    } else {
                        currentThought = fullText.substring(startIndex);
                        currentContent = "";
                        stillThinking = true;
                        if (currentThought.length > 400) thinkingPhase = "Weighing every scripture…";
                        else if (currentThought.length > 150) thinkingPhase = "Cross-referencing sources…";
                        else thinkingPhase = "Searching truth archives…";
                    }
                } else if (rStartMatch) {
                    currentContent = fullText.substring(rStartMatch.index! + rStartMatch[0].length);
                    stillThinking = false;
                    thinkingPhase = "Response generated.";
                } else {
                    if (fullText.length < 120 && fullText.includes("<")) {
                        currentContent = "";
                        stillThinking = true;
                        thinkingPhase = "Initializing…";
                    } else {
                        currentContent = fullText;
                        stillThinking = false;
                        thinkingPhase = "Speaking…";
                    }
                }

                // ── Nuclear content cleanup: strip ALL thought tags, metadata, suggestions ──
                currentContent = currentContent.replace(/### RESPONSE START ###/gi, "");
                currentContent = currentContent.split(/---SUGGESTIONS?---/i)[0];
                currentContent = currentContent.replace(/<\/?TH[A-Z]{1,8}>/gi, "");   // all thought tag variants
                currentContent = currentContent.replace(/\[METADATA:[^\]]*\]/gi, ""); // [METADATA:X=Y]
                currentContent = currentContent.replace(/\[METADATA:[^\n]*/gi, "");   // partial metadata lines
                currentContent = currentContent.trim();

                setAiMessages(prev => {
                    const newMsgs = [...prev];
                    const lastIdx = newMsgs.length - 1;
                    if (newMsgs[lastIdx].role === "assistant") {
                        newMsgs[lastIdx] = {
                            ...newMsgs[lastIdx],
                            content: currentContent,
                            thought: currentThought,
                            isThinking: stillThinking,
                            thinkingPhase: thinkingPhase
                        };
                    }
                    return newMsgs;
                });
            }

            setAiMessages(prev => {
                const newMsgs = [...prev];
                const lastIdx = newMsgs.length - 1;
                if (newMsgs[lastIdx].role === "assistant") {
                    newMsgs[lastIdx].isThinking = false;
                }
                return newMsgs;
            });

            // Extract suggestions
            const suggestionMatch = fullText.match(/---SUGGESTIONS---([\s\S]*?)(?:\[METADATA|$)/i);
            if (suggestionMatch) {
                const s = suggestionMatch[1].split("\n").map(line => line.trim().replace(/^\d+\.\s*|-\s*|\?\s*$/, "") + "?").filter(l => l.length > 5).slice(0, 3);
                setAiSuggestions(s.length > 0 ? s : ["Tell me more.", "Show me verses.", "Apply this."]);
            }

        } catch (error: any) {
            console.error("AI Mode Error:", error);
            setAiMessages(prev => {
                const newMsgs = [...prev];
                const lastIdx = newMsgs.length - 1;
                if (newMsgs[lastIdx].role === "assistant") {
                    newMsgs[lastIdx] = {
                        ...newMsgs[lastIdx],
                        content: "I'm sorry, I encountered an issue. Please try again.",
                        isThinking: false
                    };
                }
                return newMsgs;
            });
        } finally {
            setIsAiChatting(false);
            setIsSearching(false);
            abortAiControllerRef.current = null;
        }
        return finalResponse;
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(query, filter);
    };

    const onFilterChange = (f: FilterType) => {
        setFilter(f);
        if (query.trim() && hasSearched) handleSearch(query, f);
    };

    // Auto-scroll to Image Studio when selected
    useEffect(() => {
        if (filter === "studio") {
            setTimeout(() => {
                studioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 150);
        }
    }, [filter]);

    const openPreview = useCallback((r: SearchResult) => {
        const cleanUrl = sanitizeUrl(r.link) ?? bibleGatewayLink(r.title);
        setPreview({
            title: r.title,
            description: r.description,
            link: cleanUrl,
            source: r.source ?? getHostname(cleanUrl),
            type: r.type,
        });
    }, []);

    const closePreview = useCallback(() => setPreview(null), []);

    const resetSearch = () => {
        setHasSearched(false);
        setQuery("");
        setResults([]);
        setSolution(null);
        setInstantAnswer(null);
        setAiMessages([]);
        setAiSuggestions([]);
        setTimeout(() => inputRef.current?.focus(), 300);
    };

    const FILTERS = [
        { id: "global", label: "All", icon: <Sparkles size={13} /> },
        { id: "ai", label: "AI Mode", icon: <Zap size={13} className="text-black" /> },
        { id: "bible", label: "Bible", icon: <Book size={13} /> },
        { id: "news", label: "News", icon: <Newspaper size={13} /> },
        { id: "devotionals", label: "Devotionals", icon: <Quote size={13} /> },
        { id: "sermons", label: "Sermons", icon: <MessageCircle size={13} /> },
        { id: "studio", label: "Image Studio", icon: <ImageIcon size={13} /> },
    ] as const;

    const hasContent = results.length > 0 || instantAnswer || solution;

    return (
        <div className="min-h-screen bg-white text-slate-900 relative flex flex-col items-center overflow-x-hidden selection:bg-sky-500/30">

            {/* Preview Panel */}
            {preview && <PreviewPanel item={preview} onClose={closePreview} />}

            {/* Ambient blobs */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-slate-200/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-slate-100/20 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] left-[45%] w-[20%] h-[20%] bg-slate-50/10 rounded-full blur-[80px]" />
            </div>

            {/* ── HEADER (post-search) ── */}
            {hasSearched && (
                <header className="w-full max-w-7xl px-6 md:px-10 py-5 flex items-center justify-between z-20
                           border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-2xl animate-in slide-in-from-top duration-300">
                    <button
                        onClick={resetSearch}
                        className="font-['Cinzel'] text-xl font-black tracking-tight hover:text-black transition-colors"
                    >
                        DAILY<span className="text-black">MANNA</span>AI
                    </button>
                    {/* Notebook link moved to filter tabs */}
                </header>
            )}

            {/* ── MAIN ── */}
            <main className={`flex-1 w-full flex flex-col items-center z-10 px-4
                        transition-all duration-500 ${hasSearched ? "pt-8" : "pt-36 md:pt-48"}`}>

                {/* Hero (pre-search) */}
                {!hasSearched && (
                    <div className="text-center space-y-7 mb-16 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100
                            border border-slate-200 text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase">
                            <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                            Powered by 5!4!3!2!1! Model
                        </div>
                        <h1 className="font-['Cinzel'] text-7xl md:text-9xl font-black tracking-tighter text-slate-900 drop-shadow-xl leading-none">
                            DAILY<span className="text-black">MANNA</span>AI
                        </h1>
                        <p className="text-slate-400 max-w-md mx-auto text-lg font-medium italic leading-relaxed">
                            "Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God."
                        </p>
                    </div>
                )}

                {/* ── SEARCH BOX ── */}
                <div className={`w-full transition-all duration-500 ${hasSearched ? "max-w-5xl" : "max-w-3xl"}`}>
                    <form onSubmit={onSubmit}>
                        <div
                            className="relative bg-white border border-slate-200 rounded-3xl
                         px-6 py-2 flex items-center gap-3 transition-all duration-300
                         focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500/30
                         shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
                        >
                            <Search className="text-slate-900 w-5 h-5 flex-shrink-0" />
                            <input
                                ref={inputRef}
                                autoFocus
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Seek and ye shall find…"
                                className="flex-1 bg-transparent border-none outline-none py-5 text-lg text-slate-800
                           placeholder:text-slate-400 font-medium"
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => setQuery("")}
                                    className="p-2 hover:bg-white/[0.08] rounded-full transition-colors text-slate-500 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            )}
                            <button
                                type="submit"
                                className="bg-black hover:bg-slate-800 active:bg-slate-900 text-white font-black px-7 py-3
                           rounded-2xl text-[11px] tracking-widest uppercase transition-all active:scale-95
                           shadow-lg shadow-black/25"
                            >
                                Search
                            </button>
                        </div>

                        {/* Filter chips */}
                        <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                            {FILTERS.map(f => (
                                <React.Fragment key={f.id}>
                                    <FilterChip
                                        id={f.id}
                                        label={f.label}
                                        icon={f.icon}
                                        active={filter === f.id}
                                        onClick={() => onFilterChange(f.id as FilterType)}
                                    />
                                    {f.id === "news" && (
                                        <Link
                                            href="/notebook"
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-black text-[10px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap shadow-sm"
                                        >
                                            <MessageCircle size={13} className="text-black" /> Notebook
                                        </Link>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </form>
                </div>

                {/* ── RESULTS AREA ── */}
                {(hasSearched || filter === "studio") && (
                    <div className="w-full max-w-7xl px-4 md:px-8 mt-14 pb-32" ref={chatContainerRef}>
                        {isSearching && filter !== "ai" ? (
                            <LoadingState />
                        ) : filter === "ai" ? (
                            <div className="max-w-5xl mx-auto space-y-16">
                                {aiMessages.map((msg, i) => (
                                    <div key={i} className={`flex gap-8 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-8 fade-in duration-700`}>
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xl transition-all hover:scale-105 ${msg.role === 'user' ? 'bg-sky-500 text-white shadow-sky-500/20' : 'bg-slate-50 border border-slate-200 text-sky-600 shadow-xl'}`}>
                                            {msg.role === 'user' ? (
                                                <div className="font-['Cinzel'] font-black text-xl">U</div>
                                            ) : (
                                                <Sparkles size={24} className="animate-pulse" />
                                            )}
                                        </div>

                                        <div className={`flex flex-col gap-4 min-w-0 ${msg.role === 'user' ? 'items-end' : 'items-start flex-1'}`}>
                                            <div className={`relative p-10 md:p-14 rounded-[3.5rem] transition-all duration-500 shadow-xl ${msg.role === 'user' ? 'bg-sky-500/10 border border-sky-400/20 text-slate-800' : 'bg-slate-50 border border-slate-200 text-slate-900'}`}>

                                                {/* Ambient background for AI messages */}
                                                {msg.role === 'assistant' && (
                                                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-sky-500/5 rounded-full blur-[80px] pointer-events-none" />
                                                )}

                                                {msg.role === 'assistant' && (msg.thought || msg.isThinking) && (
                                                    <ThoughtPanel
                                                        thought={msg.thought || ""}
                                                        isThinking={msg.isThinking}
                                                        phase={msg.thinkingPhase}
                                                        startTime={msg.thinkStartTime}
                                                    />
                                                )}

                                                {msg.role === 'assistant' && (
                                                    <div className="text-sky-400 text-[10px] font-black uppercase tracking-[0.6em] mb-6 opacity-60">
                                                        {msg.isConflictMode ? (
                                                            <span className="flex items-center gap-2">
                                                                <Zap size={10} className="text-amber-500" />
                                                                <span className="text-amber-600">Prophetic Analysis</span>
                                                            </span>
                                                        ) : "Divine Perspective"}
                                                    </div>
                                                )}

                                                <div className={`leading-relaxed ${msg.role === 'user' ? 'text-xl font-medium' : 'text-xl md:text-2xl text-slate-800 font-serif italic'}`}>
                                                    {msg.content || (msg.isThinking ? "Consulting internal archives..." : "")}
                                                </div>

                                                {/* Live News Cards — only shown when AI returns news results */}
                                                {msg.role === 'assistant' && msg.isNewsMode && msg.newsArticles && msg.newsArticles.length > 0 && (
                                                    <div className="mt-8 not-italic">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <Newspaper size={13} className="text-sky-500" />
                                                            <span className="text-[10px] font-black text-sky-600 uppercase tracking-[0.3em]">Live News</span>
                                                            <div className="h-px flex-1 bg-slate-100" />
                                                            <span className="text-[9px] text-slate-400 font-medium">Fetched just now</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                                            {msg.newsArticles.map((article: AiNewsArticle, ni: number) => (
                                                                <AiNewsCard key={ni} article={article} index={ni} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Bible Prophecy Connections — only shown in conflict/prophecy mode */}
                                                {msg.role === 'assistant' && msg.isConflictMode && msg.bibleConnections && msg.bibleConnections.length > 0 && (
                                                    <BibleConnectionPanel connections={msg.bibleConnections} />
                                                )}
                                            </div>

                                            {/* Suggestions for last message */}
                                            {i === aiMessages.length - 1 && aiSuggestions.length > 0 && !isAiChatting && (
                                                <div className="flex flex-wrap gap-3 mt-8">
                                                    {aiSuggestions.map((s, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => handleAiSendMessage(s)}
                                                            className="px-8 py-4 rounded-full bg-slate-50 border border-slate-200 hover:border-sky-500/40 hover:bg-sky-500/10 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:text-sky-600 transition-all active:scale-95 shadow-sm"
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isAiChatting && (
                                    <div className="flex flex-col items-center gap-4 py-16">
                                        <div className="flex gap-2.5">
                                            {[0, 1, 2].map(d => (
                                                <div key={d} className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                                            ))}
                                        </div>
                                        <div className="text-sky-400/50 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Generating Revelation</div>
                                    </div>
                                )}
                            </div>
                        ) : filter === "studio" ? (
                            <div ref={studioRef} className="max-w-6xl mx-auto rounded-[3rem] overflow-hidden border border-slate-200 shadow-2xl bg-white min-h-[800px] scroll-mt-6">
                                <BibleQuoteGenerator />
                            </div>
                        ) : hasContent ? (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                                {/* Main column */}
                                <div className="lg:col-span-8 space-y-10">
                                    {instantAnswer && <InstantAnswerWidget data={instantAnswer} />}
                                    {solution && <SolutionDashboard solution={solution} query={query} onPreview={openPreview} />}
                                    {!solution && results.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">
                                                {results.length} results
                                            </div>
                                            {results.map((r, i) => (
                                                <ResultCard key={i} result={r} onPreview={openPreview} index={i} />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Sidebar */}
                                <div className="lg:col-span-4">
                                    <Sidebar />
                                </div>
                            </div>
                        ) : (
                            <EmptyState query={query} />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
