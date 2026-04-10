"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Search, Book, Newspaper, Sparkles, MessageCircle, X,
    ExternalLink, Clock, Calculator, Calendar, PlayCircle, Quote,
    ChevronLeft, Globe, Share2, BookOpen, ChevronRight, Zap,
    ArrowUpRight, Filter, CheckCircle, Star, Hash, Copy, Check,
    Bell
} from "lucide-react";
import Link from "next/link";
import BibleQuoteGenerator from "@/components/notebook/BibleQuoteGenerator";
import { Image as ImageIcon } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import RichAIMessage from "./RichAIMessage";
import { useAuth } from "@/hooks/useAuth";
import DevotionalsTab from "./DevotionalsTab";
import SermonsTab from "./SermonsTab";
import VoiceInput from "@/components/notebook/VoiceInput";
import { Mic2 } from "lucide-react";

// â”€â”€â”€ TYPES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    if (!host || host.includes("google.com")) return "";
    return `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
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

// â”€â”€â”€ COPY BUTTON â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ AI NEWS CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    const faviconSrc = (article as any).favicon || faviconUrl(article.link);
    const timeAgo = article.pubDate ? (() => {
        const diff = Date.now() - new Date(article.pubDate).getTime();
        const h = Math.floor(diff / 3_600_000);
        const d = Math.floor(diff / 86_400_000);
        return h < 1 ? "Just now" : h < 24 ? `${h}h ago` : `${d}d ago`;
    })() : null;

    return (
        <div
            className="group relative bg-white hover:bg-slate-50 rounded-[2rem] border border-border hover:border-gold/30 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md animate-in fade-in slide-in-from-bottom-3"
            style={{ animationDelay: `${index * 70}ms`, animationFillMode: "both" }}
        >
            <div className="p-6">
                {/* Source row */}
                <div className="flex items-center gap-2 mb-4">
                    {faviconSrc ? (
                        <img src={faviconSrc} alt="" className="w-4 h-4 rounded-sm object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                        <div className="w-4 h-4 rounded-sm bg-gold-pale flex items-center justify-center flex-shrink-0">
                            <Globe size={10} className="text-gold" />
                        </div>
                    )}
                    <span className="text-[10px] font-black text-text-3 uppercase tracking-widest truncate">{article.source || host}</span>
                    {timeAgo && <span className="ml-auto text-[10px] text-text-3 font-medium flex-shrink-0">{timeAgo}</span>}
                </div>

                {/* Title */}
                <h4 className="text-navy font-bold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-gold transition-colors">
                    {article.title}
                </h4>

                {/* Description */}
                {article.description && (
                    <p className="f-display text-text-2 text-xs leading-relaxed line-clamp-2 opacity-80">{article.description}</p>
                )}
            </div>

            {/* Read button */}
            <div className="px-6 pb-5">
                <button
                    onClick={() => { const u = article.link; if (u) window.open(u, "_blank", "noopener,noreferrer"); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-navy hover:bg-navy-2 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-navy/10"
                >
                    <ArrowUpRight size={12} /> Read Full Revelation
                </button>
            </div>
        </div>
    );
}

// ─── BIBLE CONNECTION PANEL ─────────────────────────────────────────────────────────────

interface BibleConnection {
    reference: string;
    verse: string;
    connection: string;
}

function BibleConnectionPanel({ connections }: { connections: BibleConnection[] }) {
    if (!connections || connections.length === 0) return null;

    return (
        <div className="mt-8 not-italic">
            <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-xl bg-gold-pale flex items-center justify-center border border-gold/10">
                    <Book size={14} className="text-gold" />
                </div>
                <span className="text-[10px] font-black text-gold uppercase tracking-[0.35em]">
                    Biblical Prophecy Connection
                </span>
                <div className="h-px flex-1 bg-gold-border" />
                <span className="text-[9px] text-gold/70 font-medium italic">KJV Â· Golden Lens</span>
            </div>

            <div className="space-y-4">
                {connections.map((bc, i) => (
                    <div
                        key={i}
                        className="relative rounded-[2rem] overflow-hidden border border-gold-border bg-white shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                        style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-pale/30 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-navy text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-navy/20">
                                    <BookOpen size={9} />
                                    {bc.reference}
                                </span>
                                <div className="flex gap-1">
                                    {[...Array(3)].map((_, s) => (
                                        <Star key={s} size={8} className="fill-gold text-gold" />
                                    ))}
                                </div>
                            </div>

                            <blockquote className="f-display text-navy text-base italic leading-relaxed mb-4 pl-4 border-l-2 border-gold pr-2">
                                &ldquo;{bc.verse}&rdquo;
                            </blockquote>

                            <div className="flex items-start gap-2.5 bg-gold-pale/20 p-4 rounded-xl border border-gold-border">
                                <Zap size={11} className="text-gold flex-shrink-0 mt-0.5" />
                                <p className="text-navy/70 text-xs leading-relaxed font-medium">{bc.connection}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// â”€â”€â”€ RESULT CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
            className="result-card"
            style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
        >
            {/* Source row */}
            <div className="flex items-center gap-2 mb-4">
                {result.favicon || faviconUrl(finalUrl) ? (
                    <img
                        src={result.favicon || faviconUrl(finalUrl)}
                        alt=""
                        className="w-4 h-4 rounded-sm object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                ) : (
                    <div className="w-4 h-4 rounded-sm bg-border-light flex items-center justify-center flex-shrink-0">
                        <Globe size={10} className="text-text-3" />
                    </div>
                )}
                <span className="text-[10px] font-black text-text-3 uppercase tracking-widest">
                    {isBible ? "Holy Bible Â· KJV" : (result.source || host || "Trusted Source")}
                </span>
                {isBible && <span className="ml-1 px-2.5 py-0.5 rounded-full bg-gold-pale text-gold text-[9px] font-black uppercase tracking-wider">Scripture</span>}
            </div>

            {/* Title */}
            <h3 className="result-title group-hover:text-gold">
                {result.title}
            </h3>

            {/* Description */}
            <p className="f-display text-text-2 text-sm leading-relaxed line-clamp-2 mb-6 italic opacity-80">
                {isBible ? `"${result.description}"` : result.description}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-4">
                {/* PRIMARY â€” Open Link */}
                <button
                    onClick={() => openLink(finalUrl)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-navy hover:bg-navy-2 text-white text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-navy/10"
                >
                    <ArrowUpRight size={13} />
                    {isBible ? "Read Chapter" : "Read Full"}
                </button>

                {/* SECONDARY â€” Quick Preview */}
                <button
                    onClick={() => onPreview({ ...result, link: finalUrl })}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-border hover:border-gold/40 text-text-3 hover:text-navy text-xs font-black uppercase tracking-widest transition-all"
                >
                    <BookOpen size={12} />
                    Insight
                </button>

                <div className="flex-1" />
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
                            {ref} â†—
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// â”€â”€â”€ SIDE PREVIEW PANEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

            {/* Panel â€” slides in from RIGHT */}
            <div
                className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg bg-white border-l border-slate-200 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
            >
                {/* Panel header */}
                <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        {faviconUrl(finalUrl) && (
                            <img src={faviconUrl(finalUrl)} alt="" className="w-5 h-5 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        )}
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest truncate max-w-[240px]">
                            {isBible ? "Holy Bible Â· King James Version" : host}
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
                                        Most Christian news sites block embedded viewing for security. Click the button below to read the full article directly on the source â€” it opens instantly in a new tab.
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
                        className="flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-sm uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-sky-500/25"
                    >
                        <ArrowUpRight size={16} />
                        {isBible ? "Read on BibleGateway.com" : "Open Full Article"}
                    </button>
                    <CopyButton text={finalUrl} />
                </div>
            </div >
        </>
    );
}

// â”€â”€â”€ INSTANT ANSWER WIDGET â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

            {/* Bible ref â€” open on BibleGateway */}
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

// â”€â”€â”€ PAGINATION WIDGET â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PaginationWidget({ current, total, hasMore, onPageChange }: { current: number, total: number, hasMore: boolean, onPageChange: (p: number) => void }) {
    if (total <= 1) return null;
    const pages = Array.from({ length: Math.min(total, 10) }, (_, i) => i + 1);

    return (
        <div className="flex flex-col items-center justify-center space-y-6 py-16 border-t border-slate-100 mt-12">
            <div className="flex items-baseline space-x-1.5 mb-2 select-none">
                <span className="text-3xl font-black text-sky-600">M</span>
                <span className="text-2xl font-bold text-red-500">a</span>
                <span className="text-2xl font-bold text-amber-500">n</span>
                <span className="text-2xl font-bold text-sky-600">n</span>
                <span className="text-2xl font-bold text-green-500">a</span>
                <span className="text-2xl font-bold text-sky-600">a</span>
                <span className="text-2xl font-bold text-red-500">a</span>
                <span className="text-lg font-black text-slate-300 ml-2 tracking-widest uppercase">Search</span>
            </div>

            <div className="flex items-center space-x-2">
                {current > 1 && (
                    <button
                        onClick={() => onPageChange(current - 1)}
                        className="px-5 py-2.5 text-xs font-black text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all uppercase tracking-widest"
                    >
                        Previous
                    </button>
                )}

                {pages.map(p => (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={`w-11 h-11 flex items-center justify-center rounded-xl text-sm font-black transition-all
                            ${current === p
                                ? "bg-slate-900 text-white shadow-2xl scale-110"
                                : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"}`}
                    >
                        {p}
                    </button>
                ))}

                {hasMore && (
                    <button
                        onClick={() => onPageChange(current + 1)}
                        className="px-5 py-2.5 text-xs font-black text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all uppercase tracking-widest"
                    >
                        Next
                    </button>
                )}
            </div>
        </div>
    );
}

// â”€â”€â”€ SOLUTION DASHBOARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
            <div className="relative rounded-[3.5rem] bg-white border border-gold-border p-12 overflow-hidden shadow-sm">
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-gold-pale/40 rounded-full blur-[90px] pointer-events-none" />
                <div className="relative z-10 text-center space-y-6 max-w-2xl mx-auto">
                    <div className="text-gold text-[10px] font-black uppercase tracking-[0.6em]">Holy Spirit Perspective</div>
                    <h2 className="f-title text-3xl md:text-5xl font-black text-navy leading-tight italic">
                        "{query}"
                    </h2>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto" />
                    <p className="f-display text-navy text-xl md:text-2xl leading-relaxed italic opacity-90">
                        "{solution.insight}"
                    </p>

                    {/* Deep Crawl Suggestion */}
                    {solution && solution.deepCrawlAvailable && (
                        <div className="pt-8">
                            <button
                                onClick={async () => {
                                    alert("Deep Crawler Triggered! The Prophetic Sentinel is now scanning YouTube, Social Feeds, and Global News for '" + query + "'. Our background engine will update your results shortly.");
                                }}
                                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-navy hover:bg-navy-2 text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 group shadow-xl shadow-navy/20"
                            >
                                <Zap size={14} className="group-hover:animate-pulse text-gold" />
                                Activate Prophetic Deep Search
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* â”€â”€ 5 BIBLE VERSES â”€â”€ */}
            {solution.bible?.length > 0 && (
                <section className="space-y-6">
                    <SectionHeader icon={<Book size={16} />} label="5 Scriptural Foundations" color="text-amber-500" />
                    <div className="space-y-4">
                        {(solution.bible as SearchResult[]).map((b, i) => {
                            const bgLink = bibleGatewayLink(b.title);
                            return (
                                <div
                                    key={i}
                                    className={`group bg-white/[0.025] hover:bg-white/[0.045] p-7 rounded-[2rem] border border-white/[0.06] hover:border-amber-500/25 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2`}
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
                                        onClick={() => onPreview({ ...b, link: bgLink, type: "bible", source: "Holy Bible Â· KJV" })}
                                        className="mt-4 text-[10px] font-black text-amber-500/50 hover:text-amber-400 uppercase tracking-widest transition-colors"
                                    >
                                        Preview verse context â†’
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* â”€â”€ 4 NEWS â”€â”€ */}
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
                        Crawlers are scanning global news â€” search again in a moment.
                    </div>
                )}
            </section>

            {/* â”€â”€ DEVOTIONALS + SERMONS â”€â”€ */}
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
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">{s.speaker} Â· {s.length}</p>
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

// â”€â”€â”€ NEWS CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
            className="group bg-white hover:bg-slate-50 rounded-[2rem] border border-slate-200 hover:border-sky-500/25 transition-all duration-300 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 shadow-sm hover:shadow-md"
            style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
        >
            <div className="p-6 flex-1">
                <div className="flex items-center gap-2 mb-3">
                    {item.favicon || faviconUrl(cleanUrl) ? (
                        <img
                            src={item.favicon || faviconUrl(cleanUrl)} alt="" className="w-4 h-4 rounded-sm object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                    ) : (
                        <div className="w-4 h-4 rounded-sm bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                            <Globe size={10} className="text-sky-500" />
                        </div>
                    )}
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

// â”€â”€â”€ SECTION HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ FILTER CHIP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ EMPTY STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
                    "Seek and ye shall find..."
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

// â”€â”€â”€ LOADING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
                    Searching the Scripturesâ€¦
                </div>
                <div className="text-slate-500 text-sm italic font-serif">"Knock, and it shall be opened unto you"</div>
            </div>
        </div>
    );
}

// â”€â”€â”€ SIDEBAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ DEEPSEEK-STYLE THOUGHT PANEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
            {/* â”€â”€ Header bar â”€â”€ */}
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
                            {phase || "Thinkingâ€¦"}
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

            {/* â”€â”€ Collapsible body â”€â”€ */}
            {open && (
                <div className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50
                                overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="max-h-48 overflow-y-auto px-5 py-4
                                    text-[12.5px] leading-relaxed text-slate-500
                                    font-mono whitespace-pre-wrap break-words">
                        {thought || (isThinking ? "Gathering insightsâ€¦" : "")}
                        {isThinking && (
                            <span className="inline-block w-1.5 h-3.5 bg-slate-400 ml-0.5 animate-pulse align-middle" />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// â”€â”€â”€ MAIN COMPONENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type FilterType = "global" | "bible" | "news" | "devotionals" | "sermons" | "ai" | "studio" | "notebook" | "alerts";


export default function SearchEnginePortal() {
    const [query, setQuery] = useState("");
    const { isLoggedIn } = useAuth();
    const [filter, setFilter] = useState<FilterType>("global");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [pagination, setPagination] = useState<{ current: number, total: number, hasMore: boolean } | null>(null);
    const [solution, setSolution] = useState<any>(null);
    const [instantAnswer, setInstantAnswer] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [preview, setPreview] = useState<PreviewPanel | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const studioRef = useRef<HTMLDivElement>(null);
    const [isVoiceActive, setIsVoiceActive] = useState(false);

    // AI Mode States
    const [aiMessages, setAiMessages] = useState<any[]>([]);
    const [isAiChatting, setIsAiChatting] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([
        "Who is Jesus Christ according to the Bible?",
        "What does the Bible say about anxiety and worry?",
        "How should a Christian pray according to Jesus?",
        "What is the meaning of John 3:16?",
        "Who is the Holy Spirit and what is His role?",
        "What are the greatest commandments?"
    ]);
    const abortAiControllerRef = useRef<AbortController | null>(null);

    // â–¸ Prophetic Alerts State
    const [alertsEnabled, setAlertsEnabled] = useState(false);
    const [isSentinelScanning, setIsSentinelScanning] = useState(false);
    const [inAppAlert, setInAppAlert] = useState<{ title: string; body: string; link: string; source: string } | null>(null);

    // Auto-resize textarea based on content
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [query]);

    // Load saved preference on mount seamlessly
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("prophetic-alerts-enabled");
            if (saved === "true") {
                setAlertsEnabled(true);
            }
        }
    }, []);

    // â”€â”€ PROPHETIC SENTINEL LOOP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const togglePropheticAlerts = async (e?: React.MouseEvent) => {
        if (e && e.preventDefault) e.preventDefault();
        try {
            const newState = !alertsEnabled;
            setAlertsEnabled(newState);
            localStorage.setItem("prophetic-alerts-enabled", newState.toString());

            // If we are turning it ON, try to ask for native OS permissions quietly
            if (newState && typeof window !== "undefined" && "Notification" in window) {
                if (Notification.permission === "default") {
                    try {
                        const permPromise = Notification.requestPermission();
                        if (permPromise && permPromise.then) permPromise.then(() => { }).catch(() => { });
                    } catch (err) {
                        // Ignore legacy callback errors
                    }
                }
            }
        } catch (error) {
            console.error("Failed to toggle prophetic alerts:", error);
        }
    };

    useEffect(() => {
        if (!alertsEnabled) return;

        // Immediately start scanning if enabled
        const scan = async () => {
            setIsSentinelScanning(true);
            try {
                const res = await fetch("/api/alerts/scan");
                const data = await res.json();

                if (data.active && data.alert) {
                    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                        // Desktop OS Notification
                        new Notification(data.alert.title, {
                            body: `${data.alert.source}: ${data.alert.body}`,
                            icon: "https://www.google.com/s2/favicons?domain=dailymannaai.com&sz=128",
                            tag: data.alert.link, // avoid dups
                        }).onclick = () => {
                            window.open(data.alert.link, "_blank");
                        };
                    } else {
                        // Fallback: Custom In-App Toast Notification
                        setInAppAlert({
                            title: data.alert.title,
                            body: data.alert.body,
                            link: data.alert.link,
                            source: data.alert.source
                        });
                    }
                }
            } catch (err) {
                console.error("Sentinel Poll Error:", err);
            } finally {
                setIsSentinelScanning(false);
            }
        };

        scan();
        const poll = setInterval(scan, 300_000); // Poll every 5 minutes (300,000ms)
        return () => clearInterval(poll);
    }, [alertsEnabled]);

    const handleSearch = useCallback(async (searchQuery: string, searchFilter: FilterType, pageNumber: number = 1) => {
        const q = searchQuery.trim();
        if (!q) return;

        if (searchFilter === "ai") {
            handleAiSendMessage(q);
            return;
        }

        setIsSearching(true);
        // Scroll to top on page change
        if (pageNumber > 1) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }

        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${searchFilter}&page=${pageNumber}`);
            const data = await res.json();
            if (res.ok) {
                setResults(Array.isArray(data?.results) ? data.results : []);
                setInstantAnswer(data?.instantAnswer || null);
                setSolution(data?.solution || null);
                setPagination(data?.pagination || null);
                setHasSearched(true);
            } else {
                console.error("Search failed:", res.status);
                setResults([]);
            }
        } catch (err) {
            console.error("Search failed:", err);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [aiMessages, query, filter, setResults, setInstantAnswer, setSolution, setHasSearched, setIsSearching, setPagination]);

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

            // Extract metadata from headers
            const isNewsModeHeader = res.headers.get("X-Is-News-Mode") === "true";
            const isConflictModeHeader = res.headers.get("X-Is-Conflict-Mode") === "true";
            const newsArticlesRaw = res.headers.get("X-News-Articles");
            let newsArticles = [];
            if (newsArticlesRaw) {
                try {
                    newsArticles = JSON.parse(atob(newsArticlesRaw));
                } catch (e) { console.warn("News articles parse failure:", e); }
            }

            if (isNewsModeHeader) {
                setAiMessages(prev => {
                    const newMsgs = [...prev];
                    const lastIdx = newMsgs.length - 1;
                    if (newMsgs[lastIdx].role === "assistant") {
                        newMsgs[lastIdx] = {
                            ...newMsgs[lastIdx],
                            isNewsMode: true,
                            isConflictMode: isConflictModeHeader,
                            newsArticles: newsArticles
                        };
                    }
                    return newMsgs;
                });
            }

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

                // Broad fuzzy regex â€” catches THOUGHT, THUGHT, THOHT, THGHT, OUG variants, etc.
                const thoughtStartRegex = /<(?:THOUGHT|THUGHT|THOHT|THGHT|OUGHT|TH|O)[A-Z]*>/i;
                const thoughtEndRegex = /<\/(?:THOUGHT|THUGHT|THOHT|THGHT|OUGHT|TH|O)[A-Z]*>/i;
                const responseStartRegex = /### RESPONSE START ###/i;

                const tStartMatch = fullText.match(thoughtStartRegex);
                const tEndMatch = fullText.match(thoughtEndRegex);
                const rStartMatch = fullText.match(responseStartRegex);

                if (tStartMatch) {
                    const startIndex = tStartMatch.index! + tStartMatch[0].length;

                    // Priority 1: Closing tag found (Proper end)
                    if (tEndMatch) {
                        const endIndex = tEndMatch.index!;
                        currentThought = fullText.substring(startIndex, endIndex);
                        currentContent = fullText.substring(endIndex + tEndMatch[0].length);
                        stillThinking = false;
                        thinkingPhase = "Reasoning complete.";
                    }
                    // Priority 2: Response delimiter found (Emergency Breakout)
                    else if (rStartMatch) {
                        const endIndex = rStartMatch.index!;
                        currentThought = fullText.substring(startIndex, endIndex);
                        currentContent = fullText.substring(endIndex + rStartMatch[0].length);
                        stillThinking = false;
                        thinkingPhase = "Response generated.";
                    }
                    // Priority 3: Safety Cap (Prevent infinite thinking)
                    else if (fullText.length - startIndex > 800) {
                        currentThought = fullText.substring(startIndex, startIndex + 200) + "...";
                        currentContent = fullText.substring(startIndex + 200); // Shift far ahead
                        stillThinking = false;
                        thinkingPhase = "Speakingâ€¦";
                    }
                    // Still thinking: Main content STAYS EMPTY
                    else {
                        currentThought = fullText.substring(startIndex);
                        currentContent = "";
                        stillThinking = true;
                        thinkingPhase = "Preparing revelationâ€¦";
                    }
                } else if (rStartMatch) {
                    currentContent = fullText.substring(rStartMatch.index! + rStartMatch[0].length);
                    stillThinking = false;
                    thinkingPhase = "Response generated.";
                } else {
                    currentContent = fullText;
                    stillThinking = false;
                    thinkingPhase = "Speaking...";
                }

                // â”€â”€ Nuclear content cleanup: strip ALL variations of thought tags, metadata, suggestions â”€â”€
                currentContent = currentContent.replace(/### RESPONSE START ###/gi, "");
                currentContent = currentContent.split(/---SUGGESTIONS?---/i)[0];

                // Aggressive strip: handles partials like <THOUG, </OUGHT, even without the closing > 
                // We use a broad range but keep the < or [ prefix to avoid stripping real words.
                currentContent = currentContent.replace(/<[\\/ ]*(?:THOUGHT|THUGHT|THOHT|THGHT|OUGHT|THT|THO|THU|TH|O)[A-Z]{0,10}(?:>|(?=\s|###|$| ))/gi, "");

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

                    // â”€â”€ POST-STREAM BIBLE CONNECTIONS PARSER â”€â”€
                    if (isNewsModeHeader) {
                        const bcMatch = fullText.match(/---BIBLE_CONNECTIONS---([\.\s\S]*?)---BIBLE_CONNECTIONS_END---/i);
                        if (bcMatch) {
                            const bcBlock = bcMatch[1];
                            const entryRegex = /REF:\s*([^\n]+)\nVERSE:\s*([^\n]+)\nCONNECTION:\s*([^\n-]+)/gi;
                            let em: RegExpExecArray | null;
                            const bibleConnections = [];
                            while ((em = entryRegex.exec(bcBlock)) !== null) {
                                bibleConnections.push({
                                    reference: em[1].trim().replace(/^\[|\]$/g, ""),
                                    verse: em[2].trim().replace(/^\[|\]$/g, ""),
                                    connection: em[3].trim().replace(/^\[|\]$/g, ""),
                                });
                            }
                            newMsgs[lastIdx].bibleConnections = bibleConnections;
                        }
                    }
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
        if (f === "notebook") {
            window.location.href = "/notebook";
            return;
        }
        if (f === "bible") {
            window.location.href = "/bible-explorer";
            return;
        }
        if (f === "alerts") {
            togglePropheticAlerts();
            return;
        }
        // Image Studio requires sign-in
        if (f === "studio" && !isLoggedIn) {
            window.location.href = "/auth/signin?callbackUrl=/";
            return;
        }
        setFilter(f);
        if (f === "devotionals" || f === "studio" || f === "ai" || f === "sermons") {
            setHasSearched(true);
        } else if (query.trim()) {
            setHasSearched(true);
            handleSearch(query, f);
        } else {
            setHasSearched(false);
        }
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
        setTimeout(() => textareaRef.current?.focus(), 300);
    };

    const FILTERS = [
        { id: "global", label: "All", icon: <Sparkles size={13} /> },
        { id: "ai", label: "AI Mode", icon: <Zap size={13} /> },
        { id: "bible", label: "Bible", icon: <Book size={13} /> },
        { id: "news", label: "News", icon: <Newspaper size={13} /> },
        { id: "notebook", label: "Notebook", icon: <BookOpen size={13} /> },
        { id: "devotionals", label: "Devotionals", icon: <Quote size={13} /> },
        { id: "sermons", label: "Sermons", icon: <MessageCircle size={13} /> },
        { id: "studio", label: "Image Studio", icon: <ImageIcon size={13} /> },
        { id: "alerts", label: "Prophetic Alerts", icon: <Bell size={13} /> },
    ] as const;

    const hasContent = (results?.length ?? 0) > 0 || instantAnswer || solution;

    return (
        <div className="home-screen flex flex-col items-center">
            {/* Styles / Keyframes */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes bell-ring {
                    0%, 100% { transform: rotate(0); }
                    10%, 20% { transform: rotate(-15deg); }
                    30%, 50%, 70% { transform: rotate(15deg); }
                    40%, 60% { transform: rotate(-12deg); }
                    80% { transform: rotate(8deg); }
                    90% { transform: rotate(-5deg); }
                }
                .animate-bell {
                    animation: bell-ring 1.5s ease-in-out infinite;
                    transform-origin: top center;
                }
                .f-display { font-family: var(--f-display); }
                .f-title { font-family: var(--f-title); }
                .f-body { font-family: var(--f-body); }
            `}} />

            {/* Preview Panel */}
            {preview && <PreviewPanel item={preview} onClose={closePreview} />}

            {/* In-App Prophetic Alert Toast */}
            {inAppAlert && (
                <div className="fixed top-24 right-4 z-[9999] max-w-sm w-full bg-navy border border-gold/30 shadow-2xl rounded-2xl p-5 animate-in slide-in-from-right fade-in duration-500">
                    <button onClick={() => setInAppAlert(null)} className="absolute top-3 right-3 text-text-3 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                            <Bell className="text-gold w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <h4 className="text-gold font-bold text-sm mb-1">{inAppAlert.title}</h4>
                            <p className="text-white/80 text-xs leading-relaxed mb-3">
                                <span className="font-bold text-teal uppercase mr-1">{inAppAlert.source}:</span>
                                {inAppAlert.body}
                            </p>
                            <button
                                onClick={() => window.open(inAppAlert.link, '_blank')}
                                className="text-[10px] font-black uppercase tracking-widest text-teal hover:text-teal/80 transition-colors"
                            >
                                Read More ➔
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── HEADER ── */}
            <header className={`w-full px-4 sm:px-8 py-4 flex items-center justify-between z-50 transition-all duration-300 ${hasSearched ? "sticky top-0 bg-white/90 dark:bg-navy/90 backdrop-blur-xl border-b border-border/50 shadow-sm" : ""}`}>
                <div className="flex items-center gap-3 md:gap-10">
                    {hasSearched && (
                        <button onClick={resetSearch} className="flex items-center gap-2 text-slate-500 hover:text-navy dark:text-slate-400 dark:hover:text-gold transition-colors pr-2 border-r border-slate-200 dark:border-slate-800">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <ChevronLeft size={18} />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wider hidden sm:inline">Back</span>
                        </button>
                    )}

                    <button
                        onClick={resetSearch}
                        className="site-logo"
                    >
                        <span>DAILY</span>
                        <span className="gold">MANNA</span>
                        <span>AI</span>
                    </button>

                    {hasSearched && (
                        <div className="hidden md:flex flex-1 min-w-[300px] lg:min-w-[450px]">
                            <form onSubmit={onSubmit} className="search-bar-mini group">
                                <Search size={16} className="text-slate-400" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search the Scriptures..."
                                    className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-text-1"
                                />
                                {query && <X size={14} className="text-slate-300 cursor-pointer flex-shrink-0" onClick={() => setQuery("")} />}
                                <div className="h-4 w-px bg-slate-200 flex-shrink-0" />
                                <div className="flex-shrink-0">
                                    <VoiceInput 
                                        onTranscript={(text) => { setQuery(text); handleSearch(text, filter); }}
                                        variant="minimal"
                                    />
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-6 w-[120px] justify-end">
                    {/* Handled by global layout */}
                </div>
            </header>

            {/* ── MAIN ── */}
            <main className={`flex-1 w-full flex flex-col items-center z-10 px-4 transition-all duration-700 ${hasSearched ? (filter === 'ai' ? "pt-2" : "pt-6") : "pt-28 md:pt-36"}`}>

                {/* Hero (pre-search) */}
                {!hasSearched && (
                    <div className="text-center space-y-6 mb-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <h1 className="site-logo text-fluid-h1 !gap-2 md:!gap-4 justify-center">
                            <span>DAILY</span>
                            <span className="gold drop-shadow-[0_0_25px_rgba(200,146,42,0.3)]">MANNA</span>
                            <span>AI</span>
                        </h1>
                        <p className="f-display text-text-2 max-w-lg mx-auto text-xl md:text-2xl italic">
                            "Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God."
                        </p>
                    </div>
                )}

                {/* ── SEARCH BOX & MODES ── */}
                <div className={`w-full transition-all duration-500 ${hasSearched && filter === 'ai' ? 'mb-0' : 'max-w-4xl px-4 sm:px-0 mx-auto'}`}>
                    <form onSubmit={onSubmit}>
                        {(!hasSearched || (hasSearched && filter !== 'ai')) && (
                            <div className="flex flex-nowrap overflow-x-auto pb-4 gap-2 mb-8 items-center w-full max-w-full no-scrollbar px-2 sm:flex-wrap sm:justify-center">
                                {FILTERS.map((f) => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => onFilterChange(f.id as FilterType)}
                                        className={`mode-tab flex-shrink-0 ${filter === f.id ? 'active' : ''} ${f.id === 'alerts' && alertsEnabled ? 'border-orange bg-orange/5 text-orange' : ''}`}
                                    >
                                        {f.icon}
                                        <span>{f.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Search Bar Inner Container */}
                        <div className={`w-full transition-all duration-500 ${hasSearched ? (filter === 'ai' ? 'fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-white via-white to-transparent dark:from-navy dark:via-navy p-4 pb-8 flex justify-center' : 'max-w-4xl px-4 sm:px-0 mx-auto') : 'max-w-2xl px-4 sm:px-0 mx-auto'}`}>
                            <div className={`${hasSearched && filter === 'ai' ? 'w-full max-w-2xl' : 'w-full'}`}>
                                <div className="search-bar-main group relative shadow-2xl !rounded-[2rem] overflow-hidden min-h-[56px] py-1.5 px-4">
                                    <div className="flex-shrink-0 pt-3 text-slate-400">
                                        <Search size={18} />
                                    </div>
                                    
                                    <textarea
                                        ref={textareaRef}
                                        rows={1}
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                onSubmit(e as any);
                                            }
                                        }}
                                        placeholder={filter === 'ai' ? "Reply to DailyMannaAI..." : "Search the Scriptures..."}
                                        className="search-input-main flex-1 min-w-0 !text-[15px] sm:!text-base resize-none py-2.5 max-h-48 overflow-y-auto leading-normal"
                                    />

                                    <div className="flex items-center gap-1 sm:gap-1.5 pl-1 flex-shrink-0">
                                        {query && (
                                            <button type="button" onClick={() => setQuery("")} className="text-text-3 hover:text-navy transition-colors p-1.5 flex-shrink-0">
                                                <X size={16} />
                                            </button>
                                        )}
                                        
                                        <VoiceInput 
                                            onTranscript={(text) => {
                                                setQuery(text);
                                                handleSearch(text, filter);
                                            }} 
                                            onListeningChange={setIsVoiceActive}
                                        />

                                        <button 
                                            type="submit" 
                                            disabled={!query.trim() && !isVoiceActive}
                                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${query.trim() ? "bg-navy text-white shadow-lg active:scale-90" : "bg-slate-100 text-slate-300 dark:bg-white/5"}`}
                                        >
                                            <ArrowUpRight size={18} className="rotate-[270deg]" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {!hasSearched && (
                            <div className="flex justify-center mt-12">
                                <button
                                    type="button"
                                    onClick={togglePropheticAlerts}
                                    className={`group flex items-center gap-4 px-8 py-3 rounded-full border transition-all duration-500 ${alertsEnabled ? 'bg-orange-pale border-orange text-orange shadow-lg' : 'bg-white border-border text-text-3 hover:border-orange/40'}`}
                                >
                                    <Bell size={18} className={alertsEnabled ? 'animate-bell' : ''} />
                                    <div className="flex flex-col items-start">
                                        <span className="text-xs font-black uppercase tracking-widest">Prophetic Sentinel</span>
                                        <span className="text-[10px] opacity-60">{alertsEnabled ? (isSentinelScanning ? 'Scanning Revelations...' : 'Sentinel Active') : 'Enable Global Prophetic Scanning'}</span>
                                    </div>
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {/* ── RESULTS AREA ── */}
                {(hasSearched || filter === "studio" || filter === "devotionals") && (
                    <div className={`w-full px-2 sm:px-6 md:px-10 ${filter === 'ai' ? 'mt-4' : 'mt-14'} pb-32`} ref={chatContainerRef}>
                        {isSearching && filter !== "ai" ? (
                            <LoadingState />
                        ) : filter === "ai" ? (
                            <div className="w-full space-y-6">
                                {aiMessages.length === 0 ? (
                                    <div className="py-10 flex flex-col items-center text-center space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-sky-500/15 blur-[60px] rounded-full scale-150 animate-pulse" />
                                            <div className="w-24 h-24 rounded-[2.5rem] bg-white border border-slate-200 flex items-center justify-center relative shadow-xl">
                                                <Sparkles className="text-sky-500 w-10 h-10" />
                                            </div>
                                        </div>
                                        <div className="space-y-4 max-w-lg">
                                            <h2 className="text-4xl font-black text-slate-900 tracking-tight font-['Cinzel'] italic">
                                                Ask Anything About the Word
                                            </h2>
                                            <p className="text-slate-500 text-sm leading-relaxed font-serif italic">
                                                AI Mode provides deep, Scripture-grounded answers to your questions about faith, theology, and the Christian life.
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
                                            {aiSuggestions.map((s, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => { setQuery(s); handleAiSendMessage(s); }}
                                                    className="p-6 text-left rounded-3xl bg-white border border-slate-200 hover:border-sky-400 hover:bg-sky-50 transition-all group shadow-sm hover:shadow-md active:scale-95"
                                                >
                                                    <div className="bg-sky-500/10 w-9 h-9 rounded-xl flex items-center justify-center mb-4 group-hover:bg-sky-500 group-hover:text-white transition-all">
                                                        <MessageCircle size={14} className="text-sky-600 group-hover:text-white" />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700 group-hover:text-sky-700 block line-clamp-2">
                                                        {s}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (() => {
                                    // Group messages into [user, assistant] pairs, reverse the pairs
                                    // so newest conversation is at top, but within each pair question comes before answer
                                    const groups: any[][] = [];
                                    for (let g = 0; g < aiMessages.length; g += 2) {
                                        const pair = [aiMessages[g]];
                                        if (aiMessages[g + 1]) pair.push(aiMessages[g + 1]);
                                        groups.push(pair);
                                    }
                                    const displayMessages = groups.reverse().flat();
                                    return displayMessages.map((msg, i) => (
                                        <div key={i} className={`flex items-start gap-2 sm:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-8 fade-in duration-700`}>
                                            {/* Tiny dot — replaces large avatar */}
                                            <div className="flex-shrink-0 pt-4">
                                                <div className={`w-2.5 h-2.5 rounded-full ${msg.role === 'user' ? 'bg-sky-400' : 'bg-red-500'}`} />
                                            </div>

                                            {/* Full-width message */}
                                            <div className="flex flex-col gap-2 flex-1 min-w-0">

                                                <div className={`relative w-full p-4 sm:p-8 transition-all duration-500 text-[15px] sm:text-lg leading-relaxed ${msg.role === 'user' ? 'bg-sky-500/10 border border-sky-400/20 text-slate-800 rounded-2xl shadow-md' : 'bg-transparent text-slate-900 border-none px-0'}`}>

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

                                                    <div className={`leading-relaxed ${msg.role === 'user' ? 'text-xl font-medium' : ''}`}>
                                                        {msg.role === 'user' ? (
                                                            msg.content || ""
                                                        ) : (
                                                            <RichAIMessage
                                                                content={msg.content || (msg.isThinking ? "Consulting internal archives..." : "")}
                                                                isThinking={msg.isThinking}
                                                            />
                                                        )}
                                                    </div>

                                                    {msg.role === 'assistant' && msg.isNewsMode && msg.newsArticles && msg.newsArticles.length > 0 && (
                                                        <div className="mt-8 not-italic">
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <Newspaper size={13} className="text-sky-500" />
                                                                <span className="text-[10px] font-black text-sky-600 uppercase tracking-[0.3em]">Live News</span>
                                                                <div className="h-px flex-1 bg-slate-100" />
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                                                {msg.newsArticles.map((article: any, ni: number) => (
                                                                    <AiNewsCard key={ni} article={article} index={ni} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {msg.role === 'assistant' && msg.isConflictMode && msg.bibleConnections && msg.bibleConnections.length > 0 && (
                                                        <BibleConnectionPanel connections={msg.bibleConnections} />
                                                    )}
                                                </div>

                                                {/* Show suggestions below the latest AI answer (index 1 in pair-reversed display) */}
                                                {i === 1 && msg.role === 'assistant' && aiSuggestions.length > 0 && !isAiChatting && (
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
                                    ))
                                })()}
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
                        ) : filter === "devotionals" ? (
                            <div className="w-full">
                                <DevotionalsTab />
                            </div>
                        ) : filter === "sermons" ? (
                            <div className="w-full">
                                <SermonsTab />
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
                                    {!solution && results && results.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">
                                                {results.length} results
                                            </div>
                                            {results.map((r, i) => (
                                                <ResultCard key={i} result={r} onPreview={openPreview} index={i} />
                                            ))}

                                            {pagination && (
                                                <PaginationWidget
                                                    current={pagination.current}
                                                    total={pagination.total}
                                                    hasMore={pagination.hasMore}
                                                    onPageChange={(p) => handleSearch(query, filter, p)}
                                                />
                                            )}
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

            {/* Site Footer - Simplified */}
            <footer className="w-full py-8 text-center border-t border-slate-100 dark:border-white/5 opacity-50">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
                    &copy; {new Date().getFullYear()} DailyMannaAI &mdash; Built with Prayer
                </p>
            </footer>
        </div>
    );
}

