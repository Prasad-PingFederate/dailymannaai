// src/components/search/RichAIMessage.tsx
// Beautiful AI response renderer — pure UI layer, no functional changes
"use client";

import { useMemo, useEffect, useState, useRef, useCallback } from "react";

const CATEGORY_COLORS: Record<string, string> = {
    prayer: "#2E7D52",
    devotional: "#1a6fa8",
    bible: "#6B4CA8",
    sermon: "#C0672A",
    prophecy: "#B8860B",
    general: "#1a6fa8",
};

function detectCategory(text: string): string {
    const t = text.toLowerCase();
    if (t.includes("prayer") || t.includes("pray")) return "prayer";
    if (t.includes("sermon")) return "sermon";
    if (t.includes("prophecy") || t.includes("prophetic")) return "prophecy";
    if (t.includes("devotion")) return "devotional";
    if (t.includes("psalm") || t.includes("genesis") || t.includes("john")) return "bible";
    return "general";
}

interface Section {
    type: "heading" | "verse" | "bullet" | "paragraph" | "divider";
    text?: string;
    items?: string[];
}

function parseIntoSections(raw: string): Section[] {
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    const sections: Section[] = [];
    let bulletBuffer: string[] = [];

    function flushBullets() {
        if (bulletBuffer.length > 0) {
            sections.push({ type: "bullet", items: [...bulletBuffer] });
            bulletBuffer = [];
        }
    }

    for (const line of lines) {
        // Heading: ## Title
        if (/^#{1,3}\s/.test(line)) {
            flushBullets();
            sections.push({ type: "heading", text: line.replace(/^#{1,3}\s/, "") });
            continue;
        }
        // Heading: **Title**
        if (/^\*\*(.+)\*\*$/.test(line) || /^__(.+)__$/.test(line)) {
            flushBullets();
            const t = line.replace(/^\*\*/, "").replace(/\*\*$/, "").replace(/^__/, "").replace(/__$/, "");
            sections.push({ type: "heading", text: t });
            continue;
        }
        // Bullet list
        if (/^[-*\u2022]\s/.test(line) || /^\d+\.\s/.test(line)) {
            const text = line.replace(/^[-*\u2022]\s/, "").replace(/^\d+\.\s/, "");
            bulletBuffer.push(text);
            continue;
        }
        // Bible verse: has a verse reference number like 3:16
        if (/\d+:\d+/.test(line) && (line.includes('"') || line.includes("'") || line.includes("\u2014"))) {
            flushBullets();
            sections.push({ type: "verse", text: line });
            continue;
        }
        // Horizontal divider
        if (/^[-\u2500\u2550]{3,}$/.test(line) || line === "---") {
            flushBullets();
            sections.push({ type: "divider" });
            continue;
        }
        // Regular paragraph
        flushBullets();
        sections.push({ type: "paragraph", text: line });
    }
    flushBullets();
    return sections;
}

function InlineText({ text }: { text: string }) {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
                if (/^\*[^*]+\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
                return <span key={i}>{part}</span>;
            })}
        </>
    );
}

function TypingText({ text, color }: { text: string; color: string }) {
    const [displayed, setDisplayed] = useState("");
    const [done, setDone] = useState(false);
    const i = useRef(0);

    useEffect(() => {
        i.current = 0;
        setDisplayed("");
        setDone(false);
        const timer = setInterval(() => {
            if (i.current < text.length) {
                setDisplayed(text.slice(0, i.current + 1));
                i.current++;
            } else {
                clearInterval(timer);
                setDone(true);
            }
        }, 30);
        return () => clearInterval(timer);
    }, [text]);

    return (
        <span>
            {displayed}
            {!done && <span style={{ color, display: "inline-block" }}>|</span>}
        </span>
    );
}

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 5) return "Peace in the night hours \uD83C\uDF19";
    if (h < 12) return "Good morning, blessed one \u2600\uFE0F";
    if (h < 17) return "Good afternoon, child of God \uD83C\uDF24";
    if (h < 21) return "Good evening, friend \uD83C\uDF05";
    return "Blessings in this night hour \uD83C\uDF19";
}

function shareWA(text: string) {
    const excerpt = text.length > 300 ? text.slice(0, 300) + "..." : text;
    const msg = excerpt + "\n\n\u2014 DailyMannaAI: https://www.dailymannaai.com";
    window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
}

interface Props {
    content: string;
    isThinking?: boolean;
}

function CopyButton({ content }: { content: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(content).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [content]);

    return (
        <button
            onClick={handleCopy}
            style={{
                background: copied ? "#22c55e18" : "var(--bg-input, #f2f2f0)",
                border: copied ? "1px solid #22c55e55" : "1px solid var(--border-primary, #e0e0e0)",
                color: copied ? "#16a34a" : "var(--text-secondary, #555)",
                borderRadius: 10, padding: "8px 18px",
                fontSize: 13, cursor: "pointer", fontFamily: "sans-serif",
                transition: "all 0.25s ease",
                display: "flex", alignItems: "center", gap: 6,
                fontWeight: copied ? 600 : 400,
            }}
        >
            <span style={{ fontSize: 14, transition: "transform 0.2s", transform: copied ? "scale(1.2)" : "scale(1)" }}>
                {copied ? "\u2713" : "\uD83D\uDCCB"}
            </span>
            {copied ? "Copied!" : "Copy"}
        </button>
    );
}

export default function RichAIMessage({ content, isThinking }: Props) {
    const color = useMemo(() => {
        const cat = detectCategory(content);
        return CATEGORY_COLORS[cat] || CATEGORY_COLORS.general;
    }, [content]);

    const sections = useMemo(() => parseIntoSections(content), [content]);
    const greeting = useMemo(() => getGreeting(), []);

    if (isThinking || !content) return null;

    const firstVerse = sections.find((s) => s.type === "verse");
    const otherSections = sections.filter((s) => s !== firstVerse);

    return (
        <>
            <style>{`
                @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
                @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
                .rich-ai-card { animation: fadeUp 0.4s ease both; }
                .rich-sec-block { animation: fadeUp 0.4s ease both; }
                .rich-pad-x { padding-left: 32px; padding-right: 32px; }
                .rich-margin-x { margin-left: 32px; margin-right: 32px; }
                @media (max-width: 640px) {
                    .rich-pad-x { padding-left: 16px !important; padding-right: 16px !important; }
                    .rich-margin-x { margin-left: 16px !important; margin-right: 16px !important; }
                }
            `}</style>

            <div className="rich-ai-card adaptive-bubble" style={{
                background: "var(--bg-card, #fff)",
                border: "1px solid var(--border-secondary, #ebebeb)",
                boxShadow: "var(--shadow-card, 0 2px 12px rgba(0,0,0,0.06))",
                fontFamily: "Georgia, serif", maxWidth: 1024, width: "100%",
            }}>

                {/* Header */}
                <div className="rich-pad-x" style={{
                    paddingTop: 28, paddingBottom: 20,
                    borderLeft: "4px solid " + color,
                    borderBottom: "1px solid var(--border-secondary, #ebebeb)",
                    background: "var(--bg-secondary, #f9f9f7)",
                }}>
                    <div style={{
                        fontSize: "clamp(18px,2.5vw,24px)", fontStyle: "italic",
                        fontWeight: 400, marginBottom: 6,
                        color: "var(--text-primary, #1a1a1a)", minHeight: "1.5em",
                    }}>
                        <TypingText text={greeting} color={color} />
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted, #888)", fontStyle: "italic", fontFamily: "sans-serif" }}>
                        Here is your Spirit-led answer &nbsp;&#10022;
                    </div>
                    <span style={{
                        display: "inline-block", marginTop: 12,
                        padding: "3px 14px", borderRadius: 20,
                        background: color + "18", color,
                        border: "1px solid " + color + "44",
                        fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", fontFamily: "sans-serif",
                    }}>
                        &#128214; Divine Perspective
                    </span>
                </div>

                {/* Featured verse */}
                {firstVerse && firstVerse.text && (
                    <div className="rich-margin-x" style={{
                        marginTop: 24, marginBottom: 0,
                        borderLeft: "4px solid " + color,
                        background: color + "0a",
                        borderRadius: "0 12px 12px 0",
                        padding: "18px 24px",
                    }}>
                        <div style={{
                            fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
                            color: "var(--text-faint, #aaa)", fontFamily: "sans-serif", marginBottom: 10,
                        }}>
                            &#128220; Key Scripture
                        </div>
                        <blockquote style={{
                            fontSize: "clamp(15px,2vw,18px)", fontStyle: "italic",
                            lineHeight: 1.75, color: "var(--text-primary, #2a2a2a)",
                            margin: "0 0 10px", borderLeft: "none", padding: 0,
                        }}>
                            <InlineText text={firstVerse.text} />
                        </blockquote>
                    </div>
                )}

                {/* Main sections */}
                <div className="rich-pad-x" style={{ paddingTop: 24, paddingBottom: 8, display: "flex", flexDirection: "column", gap: 18 }}>
                    {otherSections.map((sec, i) => {
                        if (sec.type === "divider") {
                            return <div key={i} style={{ textAlign: "center", opacity: 0.35, fontSize: 14, color }}>&#10022;</div>;
                        }

                        if (sec.type === "heading") {
                            return (
                                <div key={i} className="rich-sec-block" style={{
                                    background: "var(--bg-card, white)",
                                    border: "1px solid var(--border-secondary, #ebebeb)",
                                    borderRadius: 14, padding: "18px 22px",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <span style={{ color, fontSize: 15, flexShrink: 0 }}>&#10022;</span>
                                        <h3 style={{
                                            fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
                                            fontWeight: 700, fontFamily: "sans-serif", fontStyle: "normal",
                                            color: "var(--text-muted, #999)", margin: 0,
                                        }}>
                                            {sec.text}
                                        </h3>
                                    </div>
                                </div>
                            );
                        }

                        if (sec.type === "verse") {
                            return (
                                <div key={i} style={{
                                    display: "flex", alignItems: "flex-start", gap: 12,
                                    borderLeft: "3px solid " + color,
                                    padding: "12px 16px", borderRadius: "0 10px 10px 0",
                                    background: "var(--bg-secondary, #f9f9f7)",
                                }}>
                                    <span style={{ fontSize: 16, flexShrink: 0 }}>&#128220;</span>
                                    <p style={{ fontStyle: "italic", color: "var(--text-secondary, #555)", fontSize: 15, lineHeight: 1.7, margin: 0 }}>
                                        <InlineText text={sec.text || ""} />
                                    </p>
                                </div>
                            );
                        }

                        if (sec.type === "bullet" && sec.items) {
                            return (
                                <ul key={i} style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                                    {sec.items.map((item, j) => (
                                        <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 15, color: "var(--text-secondary, #444)", lineHeight: 1.65, fontStyle: "italic" }}>
                                            <span style={{ color, flexShrink: 0, marginTop: 3, fontSize: 10 }}>&#10022;</span>
                                            <span><InlineText text={item} /></span>
                                        </li>
                                    ))}
                                </ul>
                            );
                        }

                        return (
                            <p key={i} style={{ fontSize: 15.5, color: "var(--text-secondary, #444)", lineHeight: 1.9, fontStyle: "italic", margin: 0 }}>
                                <InlineText text={sec.text || ""} />
                            </p>
                        );
                    })}
                </div>

                {/* Closing */}
                <div className="rich-margin-x" style={{
                    marginTop: 20, marginBottom: 20, padding: "16px 22px", borderRadius: 12,
                    border: "1px solid " + color + "30", background: color + "0d",
                    fontSize: 14, fontStyle: "italic",
                    color: "var(--text-secondary, #444)", lineHeight: 1.7, textAlign: "center",
                }}>
                    &#128591; May this word bring peace, wisdom, and faith to your heart today.
                </div>

                {/* Actions */}
                <div className="rich-pad-x" style={{ display: "flex", gap: 10, paddingTop: 0, paddingBottom: 24, flexWrap: "wrap" }}>
                    <button
                        onClick={() => shareWA(content)}
                        style={{
                            background: "#25D36615", border: "1px solid #25D36640",
                            color: "#128C7E", borderRadius: 10, padding: "8px 18px",
                            fontSize: 13, cursor: "pointer", fontFamily: "sans-serif", fontWeight: 600,
                        }}
                    >
                        &#128242; Share on WhatsApp
                    </button>
                    <CopyButton content={content} />
                </div>

                <div className="rich-pad-x" style={{ paddingTop: 0, paddingBottom: 16, fontSize: 11, color: "var(--text-faint, #bbb)", fontFamily: "sans-serif" }}>
                    {new Date().toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
            </div>
        </>
    );
}
