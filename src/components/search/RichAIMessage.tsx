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

    if (isThinking || !content) return null;

    return (
        <div className="w-full flex flex-col gap-4 text-base md:text-lg text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
            <style>{`
                @keyframes fadeUp { from {opacity:0; transform:translateY(8px)} to {opacity:1; transform:translateY(0)} }
                .ai-sec { animation: fadeUp 0.3s ease both; }
            `}</style>

            {sections.map((sec, i) => {
                if (sec.type === "divider") {
                    return <div key={i} className="my-4 h-px w-full bg-slate-200 dark:bg-slate-700 ai-sec" />;
                }

                if (sec.type === "heading") {
                    // Try to extract an emoji if present, else use a default based on text
                    let EmoIcon = "";
                    if (sec.text?.includes("Simple") || sec.text?.includes("explain")) EmoIcon = "✝️";
                    else if (sec.text?.includes("short") || sec.text?.includes("Life")) EmoIcon = "📖";
                    
                    return (
                        <h3 key={i} className="text-lg md:text-xl font-bold mt-4 mb-2 flex items-center gap-2 ai-sec text-slate-900 dark:text-white">
                            {EmoIcon && <span>{EmoIcon}</span>}
                            <span>{sec.text}</span>
                        </h3>
                    );
                }

                if (sec.type === "verse") {
                    return (
                        <blockquote key={i} className="border-l-4 pl-4 py-1 my-2 ai-sec italic text-slate-700 dark:text-slate-300" style={{ borderColor: color }}>
                            <InlineText text={sec.text || ""} />
                        </blockquote>
                    );
                }

                if (sec.type === "bullet" && sec.items) {
                    return (
                        <ul key={i} className="list-disc pl-5 space-y-3 ai-sec">
                            {sec.items.map((item, j) => (
                                <li key={j} className="pl-1 marker:text-slate-400">
                                    <InlineText text={item} />
                                </li>
                            ))}
                        </ul>
                    );
                }

                return (
                    <p key={i} className="ai-sec">
                        <InlineText text={sec.text || ""} />
                    </p>
                );
            })}

            <div className="mt-4 flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 ai-sec">
                <CopyButton content={content} />
                <button
                    onClick={() => shareWA(content)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-sm font-medium hover:bg-green-100 transition-colors"
                >
                    Share
                </button>
            </div>
        </div>
    );
}
