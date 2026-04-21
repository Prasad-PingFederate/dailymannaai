// src/app/blog/questions/[slug]/page.tsx
// Individual AI-generated spiritual question blog post

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import fs from "fs";
import path from "path";
import { BookOpen, ArrowLeft, ChevronRight, Sparkles, ExternalLink } from "lucide-react";

interface Question {
    slug: string;
    question: string;
    category: string;
    keywords: string[];
    searchVolume: "high" | "medium";
    createdAt: string;
    metaDescription: string;
    answer?: string;
    verseRefs?: string[];
}

const CATEGORY_META: Record<string, { label: string; color: string }> = {
    salvation: { label: "Salvation", color: "#6366f1" },
    prayer: { label: "Prayer", color: "#0ea5e9" },
    healing: { label: "Healing", color: "#22c55e" },
    faith: { label: "Faith", color: "#f59e0b" },
    prophecy: { label: "Prophecy", color: "#ef4444" },
    relationships: { label: "Relationships", color: "#ec4899" },
    suffering: { label: "Suffering", color: "#8b5cf6" },
    "holy-spirit": { label: "Holy Spirit", color: "#06b6d4" },
    church: { label: "Church", color: "#10b981" },
    bible: { label: "Bible", color: "#f97316" },
    all: { label: "General", color: "#D4AF37" },
};

function readQuestions(): Question[] {
    try {
        const dataFile = path.join(process.cwd(), "src", "data", "spiritual-questions.json");
        if (!fs.existsSync(dataFile)) return [];
        return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
    } catch { return []; }
}

function getQuestion(slug: string): Question | null {
    return readQuestions().find((q) => q.slug === slug) ?? null;
}

function getRelated(current: Question): Question[] {
    return readQuestions()
        .filter((q) => q.slug !== current.slug && q.category === current.category)
        .slice(0, 4);
}

// ── Static params (build-time SSG) ───────────────────────────────────────────
export async function generateStaticParams() {
    return readQuestions().map((q) => ({ slug: q.slug }));
}

// ── Metadata ────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const q = getQuestion(params.slug);
    if (!q) return { title: "Not Found" };
    return {
        title: `${q.question} | DailyManna AI`,
        description: q.metaDescription,
        keywords: q.keywords,
        alternates: { canonical: `https://www.dailymannaai.com/blog/questions/${q.slug}` },
        openGraph: {
            title: q.question,
            description: q.metaDescription,
            url: `https://www.dailymannaai.com/blog/questions/${q.slug}`,
            type: "article",
        },
    };
}

// ── Render answer markdown (bold + paragraphs) ────────────────────────────────
function renderAnswer(text: string) {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let key = 0;

    for (const raw of lines) {
        const line = raw.trim();
        if (!line) { elements.push(<div key={key++} className="h-4" />); continue; }

        // Bold headings: **text**
        if (/^\*\*(.+)\*\*$/.test(line)) {
            const content = line.replace(/^\*\*|\*\*$/g, "");
            elements.push(
                <h2 key={key++} className="text-navy dark:text-white font-black text-xl mt-8 mb-3 tracking-tight">
                    {content}
                </h2>
            );
            continue;
        }

        // Bullet points
        if (/^[-•]/.test(line)) {
            const content = line.replace(/^[-•]\s*/, "");
            elements.push(
                <li key={key++} className="text-slate-700 dark:text-white/80 text-[15px] leading-relaxed ml-4 mb-1 list-disc marker:text-gold">
                    {renderInline(content)}
                </li>
            );
            continue;
        }

        // Normal paragraph
        elements.push(
            <p key={key++} className="text-slate-700 dark:text-white/80 text-[15px] leading-[1.85] mb-0.5">
                {renderInline(line)}
            </p>
        );
    }
    return elements;
}

function renderInline(text: string): React.ReactNode {
    // Replace **bold** spans
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
        /^\*\*(.+)\*\*$/.test(part)
            ? <strong key={i} className="text-navy dark:text-white font-bold">{part.replace(/\*\*/g, "")}</strong>
            : <span key={i}>{part}</span>
    );
}

// ── Generate Answer Panel (client component for on-page generation) ─────────
import GenerateAnswerButton from "./GenerateAnswerButton";

// ── Page ─────────────────────────────────────────────────────────────────────
export default function QuestionPage({ params }: { params: { slug: string } }) {
    const q = getQuestion(params.slug);
    if (!q) notFound();

    const cat = CATEGORY_META[q.category] || CATEGORY_META["all"];
    const related = getRelated(q);
    const dateStr = new Date(q.createdAt).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
    });
    const readTime = q.answer ? `${Math.max(3, Math.ceil(q.answer.split(" ").length / 200))} min read` : null;

    return (
        <div className="min-h-screen bg-white dark:bg-navy" style={{ fontFamily: "Inter, sans-serif" }}>

            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-2 to-[#0d0a21] px-6 py-20">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[600px] bg-gold/10 rounded-full blur-[140px]" />
                    <div
                        className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20"
                        style={{ background: cat.color }}
                    />
                </div>
                <div className="relative max-w-3xl mx-auto space-y-6">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/30">
                        <Link href="/" className="hover:text-white/70 transition-colors">Home</Link>
                        <ChevronRight size={10} />
                        <Link href="/blog" className="hover:text-white/70 transition-colors">Blog</Link>
                        <ChevronRight size={10} />
                        <Link href="/blog/questions" className="hover:text-white/70 transition-colors">Questions</Link>
                        <ChevronRight size={10} />
                        <span className="text-white/50 truncate max-w-[180px]">{q.category}</span>
                    </nav>

                    {/* Category badge */}
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white"
                        style={{ background: `${cat.color}30`, border: `1px solid ${cat.color}40` }}
                    >
                        <BookOpen size={10} style={{ color: cat.color }} />
                        <span style={{ color: cat.color }}>{cat.label}</span>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
                        {q.question}
                    </h1>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-[10px] text-white/30 font-medium">
                        <span>DailyManna AI</span>
                        <span>•</span>
                        <span>{dateStr}</span>
                        {readTime && <><span>•</span><span>{readTime}</span></>}
                        <span>•</span>
                        <span
                            className="font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                            style={{ background: `${cat.color}20`, color: cat.color }}
                        >
                            {q.searchVolume} search volume
                        </span>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="max-w-3xl mx-auto px-6 py-16">
                <div className="space-y-10">

                    {/* --- Has Answer --- */}
                    {q.answer ? (
                        <article className="space-y-1">
                            {renderAnswer(q.answer)}
                        </article>
                    ) : (
                        /* No answer yet — show AI generate button */
                        <div className="rounded-[2.5rem] bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/20 p-10 text-center space-y-6">
                            <div className="mx-auto w-16 h-16 rounded-[1.5rem] bg-gold/10 border border-gold/20 flex items-center justify-center">
                                <Sparkles size={28} className="text-gold" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-navy dark:text-white font-black text-2xl">
                                    Answer Not Generated Yet
                                </h2>
                                <p className="text-slate-500 dark:text-white/40 text-sm max-w-sm mx-auto">
                                    Click below to have DailyManna AI write a full, Scripture-backed blog post answer for this question.
                                </p>
                            </div>
                            <GenerateAnswerButton slug={q.slug} question={q.question} />
                        </div>
                    )}

                    {/* Verse References */}
                    {q.verseRefs && q.verseRefs.length > 0 && (
                        <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-6 space-y-4">
                            <h3 className="text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                <BookOpen size={12} /> Scripture References
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {q.verseRefs.map((ref, i) => (
                                    <a
                                        key={i}
                                        href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=KJV`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold hover:bg-amber-200 dark:hover:bg-amber-500/25 transition-all"
                                    >
                                        {ref}
                                        <ExternalLink size={10} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Keywords */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/30">
                            Related Topics
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {q.keywords.map((kw) => (
                                <Link
                                    key={kw}
                                    href={`/?q=${encodeURIComponent(kw)}`}
                                    className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/50 text-xs font-medium hover:border-gold/40 hover:text-gold transition-all"
                                >
                                    #{kw}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Ask AI CTA */}
                    <div className="rounded-[2rem] bg-gradient-to-br from-navy to-navy-2 border border-white/10 p-8 flex flex-col sm:flex-row items-center gap-6">
                        <div className="flex-1 space-y-2">
                            <h3 className="text-white font-black text-lg">Want to Dig Deeper?</h3>
                            <p className="text-white/50 text-sm leading-relaxed">
                                Ask DailyManna AI a follow-up question and get a Spirit-led, Scripture-grounded answer instantly.
                            </p>
                        </div>
                        <Link
                            href={`/?q=${encodeURIComponent(q.question)}&filter=ai`}
                            className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-navy text-xs font-black uppercase tracking-widest hover:bg-gold/90 transition-all"
                        >
                            <Sparkles size={13} /> Ask DailyManna AI
                        </Link>
                    </div>

                    {/* Related Questions */}
                    {related.length > 0 && (
                        <div className="space-y-5 border-t border-slate-100 dark:border-white/5 pt-10">
                            <h3 className="text-navy dark:text-white font-black uppercase tracking-[0.15em] text-sm flex items-center gap-2">
                                <span
                                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                                    style={{ background: `${cat.color}20` }}
                                >
                                    <ChevronRight size={12} style={{ color: cat.color }} />
                                </span>
                                More {cat.label} Questions
                            </h3>
                            <div className="space-y-2">
                                {related.map((rq) => (
                                    <Link
                                        key={rq.slug}
                                        href={`/blog/questions/${rq.slug}`}
                                        className="group flex items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-white/5 hover:border-gold/30 hover:bg-gold/5 transition-all"
                                    >
                                        <div
                                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                            style={{ background: cat.color }}
                                        />
                                        <span className="text-navy dark:text-white text-sm font-medium group-hover:text-gold transition-colors flex-1 leading-snug">
                                            {rq.question}
                                        </span>
                                        <ChevronRight size={12} className="text-slate-300 dark:text-white/20 flex-shrink-0" />
                                    </Link>
                                ))}
                            </div>
                            <Link
                                href="/blog/questions"
                                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 hover:text-gold transition-colors"
                            >
                                View All Questions <ChevronRight size={10} />
                            </Link>
                        </div>
                    )}

                    {/* Back */}
                    <Link
                        href="/blog/questions"
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 hover:text-navy dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft size={10} /> All Questions
                    </Link>
                </div>
            </div>
        </div>
    );
}
