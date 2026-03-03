"use client";

import React, { useState, useEffect, useRef } from "react";

// ─── FIX 5: Match your Vercel rewrite ─────────────────────────
// API_BASE is set to /backend-api to match vercel.json rewrites
const API_BASE = "/backend-api";
// ──────────────────────────────────────────────────────────────

async function apiFetch(path: string) {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
    return res.json();
}

const toArr = (d: any) =>
    Array.isArray(d) ? d : (d?.data || d?.sermons || d?.results || []);

const SPEAKER_PALETTE = [
    "#1a1a2e", "#16213e", "#0f3460", "#533483", "#2b2d42",
    "#8d1a1a", "#1a4731", "#1a3347", "#4a1942", "#2d4a1a",
];
const speakerHue = (name: string) =>
    SPEAKER_PALETTE[(name?.charCodeAt(0) || 0) % SPEAKER_PALETTE.length];
const initials = (n: string) =>
    (n || "??").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

// ── Icons ──────────────────────────────────────────────────────
const SearchIcon = () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
);
const BackIcon = () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
);
const PlayIcon = () => (
    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
);
const PauseIcon = () => (
    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);
const BookIcon = () => (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
);
const ClockIcon = () => (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
    </svg>
);
const MicIcon = () => (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" />
    </svg>
);

// ════════════════════════════════════════════════
//  AUDIO PLAYER
// ════════════════════════════════════════════════
function AudioPlayer({ url, title }: { url: string; title: string }) {
    const ref = useRef<HTMLAudioElement>(null);
    const barRef = useRef<HTMLDivElement>(null);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [current, setCurrent] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => { setPlaying(false); setProgress(0); setCurrent(0); }, [url]);

    const fmt = (s: number) => {
        if (!s || isNaN(s)) return "0:00";
        return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    };
    const toggle = () => {
        if (!ref.current) return;
        if (playing) { ref.current.pause(); setPlaying(false); }
        else { ref.current.play(); setPlaying(true); }
    };
    const onTime = () => {
        const a = ref.current; if (!a) return;
        setCurrent(a.currentTime);
        setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
    };
    const seek = (e: React.MouseEvent) => {
        if (!barRef.current || !ref.current) return;
        const r = barRef.current.getBoundingClientRect();
        ref.current.currentTime =
            Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * ref.current.duration;
    };

    return (
        <div style={{
            background: "#f8f7f4", border: "1px solid #e8e4dc",
            borderRadius: "14px", padding: "16px 20px",
            marginBottom: "24px", display: "flex", alignItems: "center", gap: "14px"
        }}>
            <audio ref={ref} src={url} onTimeUpdate={onTime}
                onLoadedMetadata={() => setDuration(ref.current?.duration || 0)}
                onEnded={() => setPlaying(false)} style={{ display: "none" }} />

            <button onClick={toggle} style={{
                width: "42px", height: "42px", borderRadius: "50%",
                background: "#0d0d12", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", flexShrink: 0
            }}>
                {playing ? <PauseIcon /> : <PlayIcon />}
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "12px", color: "#777", fontFamily: "sans-serif", marginBottom: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {title}
                </div>
                <div ref={barRef} onClick={seek} style={{
                    height: "4px", background: "#e0dbd0", borderRadius: "10px",
                    cursor: "pointer", position: "relative", marginBottom: "5px"
                }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: "#0d0d12", borderRadius: "10px", transition: "width 0.1s" }} />
                    <div style={{
                        position: "absolute", top: "50%", left: `${progress}%`,
                        transform: "translate(-50%,-50%)", width: "12px", height: "12px",
                        borderRadius: "50%", background: "#0d0d12"
                    }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#999", fontFamily: "monospace" }}>
                    <span>{fmt(current)}</span><span>{fmt(duration)}</span>
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════
//  SERMON DETAIL
// ════════════════════════════════════════════════
function SermonDetail({ sermon, onBack }: { sermon: any; onBack: () => void }) {
    const [full, setFull] = useState<any>(sermon);

    // FIX 4: Fetch full content from /sermons/{id} if content missing
    useEffect(() => {
        if (!sermon.content && (sermon._id || sermon.id)) {
            apiFetch(`/sermons/${sermon._id || sermon.id}`)
                .then(d => setFull({ ...sermon, ...d }))
                .catch(() => { });
        }
    }, [sermon]);

    const color = speakerHue(full.speaker || "");

    return (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
            <button onClick={onBack} style={{
                display: "inline-flex", alignItems: "center", gap: "7px",
                background: "none", border: "1px solid #ddd", borderRadius: "8px",
                padding: "7px 14px", cursor: "pointer", color: "#555",
                fontFamily: "sans-serif", fontSize: "13px", marginBottom: "24px",
                transition: "all 0.2s"
            }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0d0d12"; (e.currentTarget as HTMLElement).style.color = "#0d0d12"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#ddd"; (e.currentTarget as HTMLElement).style.color = "#555"; }}
            >
                <BackIcon /> Back to Sermons
            </button>

            {/* Header */}
            <div style={{
                background: "white", border: "1px solid #eaeaea",
                borderRadius: "18px", padding: "32px", marginBottom: "20px",
                boxShadow: "0 2px 20px rgba(0,0,0,0.06)"
            }}>
                <div style={{ display: "flex", gap: "18px", alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div style={{
                        width: "56px", height: "56px", borderRadius: "14px",
                        background: color, display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: "18px", fontWeight: "700",
                        color: "white", fontFamily: "sans-serif", flexShrink: 0
                    }}>
                        {initials(full.speaker || "")}
                    </div>
                    <div style={{ flex: 1, minWidth: "250px" }}>
                        {full.series && (
                            <div style={{
                                display: "inline-block", background: "#f3f2ee", borderRadius: "6px",
                                padding: "2px 10px", fontSize: "11px", color: "#888",
                                fontFamily: "sans-serif", letterSpacing: "1px",
                                textTransform: "uppercase" as const, marginBottom: "10px"
                            }}>
                                {full.series}
                            </div>
                        )}
                        <h2 style={{
                            fontFamily: "serif",
                            fontSize: "clamp(22px, 3vw, 32px)", fontWeight: "700",
                            color: "#0d0d12", margin: "0 0 8px 0", lineHeight: "1.2"
                        }}>
                            {full.sermon_title}
                        </h2>
                        <div style={{ color: "#555", fontFamily: "sans-serif", fontSize: "14px", marginBottom: "14px" }}>
                            {full.speaker}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px" }}>
                            {full.scripture_reference && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "#eef2ff", color: "#4f46e5", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontFamily: "sans-serif" }}>
                                    <BookIcon /> {full.scripture_reference}
                                </span>
                            )}
                            {full.duration && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "#f0fdf4", color: "#16a34a", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontFamily: "sans-serif" }}>
                                    <ClockIcon /> {full.duration}
                                </span>
                            )}
                            {full.date && (
                                <span style={{ background: "#f8f7f4", color: "#777", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontFamily: "sans-serif" }}>
                                    {full.date}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {full.audio_url && <AudioPlayer url={full.audio_url} title={full.sermon_title} />}

            {full.content && (
                <div style={{
                    background: "white", border: "1px solid #eaeaea",
                    borderRadius: "18px", padding: "36px",
                    boxShadow: "0 2px 20px rgba(0,0,0,0.04)"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#bbb", fontSize: "11px", fontFamily: "sans-serif", letterSpacing: "2px", marginBottom: "24px" }}>
                        <MicIcon /> SERMON MESSAGE
                    </div>
                    {full.scripture_reference && (
                        <div style={{
                            borderLeft: "4px solid #4f46e5", background: "#eef2ff",
                            borderRadius: "0 12px 12px 0", padding: "20px 24px",
                            marginBottom: "28px", color: "#4338ca",
                            fontFamily: "serif",
                            fontSize: "18px", fontStyle: "italic", lineHeight: "1.6"
                        }}>
                            📖 {full.scripture_reference}
                        </div>
                    )}
                    <div style={{
                        color: "#2c2c2c", fontSize: "18px", lineHeight: "2.1",
                        fontFamily: "serif",
                        whiteSpace: "pre-wrap" as const
                    }}>
                        {full.content}
                    </div>
                </div>
            )}
        </div>
    );
}

// ════════════════════════════════════════════════
//  SERMON CARD
// ════════════════════════════════════════════════
function SermonCard({
    sermon, index, showSpeaker, onClick
}: {
    sermon: any; index: number; showSpeaker: boolean; onClick: () => void
}) {
    const [hov, setHov] = useState(false);

    return (
        <div onClick={onClick}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                background: hov ? "#fafaf8" : "white",
                border: `1px solid ${hov ? "#c8c4bb" : "#eaeaea"}`,
                borderRadius: "14px", padding: "18px 22px",
                cursor: "pointer", transition: "all 0.2s",
                transform: hov ? "translateY(-2px)" : "none",
                boxShadow: hov ? "0 8px 24px rgba(0,0,0,0.08)" : "0 1px 4px rgba(0,0,0,0.04)",
                animation: `fadeIn 0.5s ease both ${Math.min(index * 0.04, 0.6)}s`
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                {/* Number badge */}
                <div style={{
                    minWidth: "34px", height: "34px", borderRadius: "9px",
                    background: "#f3f2ee", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "12px", color: "#999",
                    fontFamily: "sans-serif", fontWeight: "700", flexShrink: 0
                }}>
                    {String(index + 1).padStart(2, "0")}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                        fontFamily: "serif",
                        fontSize: "17px", fontWeight: "700",
                        color: "#1a1a1a", margin: "0 0 7px 0", lineHeight: "1.4"
                    }}>
                        {sermon.sermon_title || sermon.title || "Untitled"}
                    </h3>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px", alignItems: "center" }}>
                        {/* Only show speaker name when showing ALL sermons */}
                        {showSpeaker && sermon.speaker && (
                            <span style={{
                                display: "inline-flex", alignItems: "center", gap: "5px",
                                color: "white", fontSize: "11px", fontFamily: "sans-serif",
                                background: speakerHue(sermon.speaker),
                                borderRadius: "20px", padding: "2px 10px", fontWeight: "600"
                            }}>
                                {sermon.speaker}
                            </span>
                        )}
                        {sermon.scripture_reference && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#4f46e5", fontSize: "11px", fontFamily: "sans-serif" }}>
                                <BookIcon /> {sermon.scripture_reference}
                            </span>
                        )}
                        {sermon.duration && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#16a34a", fontSize: "11px", fontFamily: "sans-serif" }}>
                                <ClockIcon /> {sermon.duration}
                            </span>
                        )}
                        {sermon.date && (
                            <span style={{ color: "#aaa", fontSize: "11px", fontFamily: "sans-serif" }}>{sermon.date}</span>
                        )}
                        {sermon.audio_url && (
                            <span style={{ color: "#ea580c", fontSize: "11px", fontFamily: "sans-serif" }}>🎵 Audio</span>
                        )}
                        {sermon.series && (
                            <span style={{ color: "#aaa", fontSize: "11px", fontFamily: "sans-serif" }}>📂 {sermon.series}</span>
                        )}
                    </div>
                </div>

                <div style={{
                    color: hov ? "#0d0d12" : "#ddd",
                    fontSize: "22px", transition: "all 0.2s",
                    transform: hov ? "translateX(3px)" : "none", flexShrink: 0
                }}>›</div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════
//  MAIN EXPORT
// ════════════════════════════════════════════════
export default function SermonsTab() {
    const [view, setView] = useState<"list" | "detail">("list");
    const [selectedSermon, setSelectedSermon] = useState<any>(null);
    const [allSermons, setAllSermons] = useState<any[]>([]);
    const [speakers, setSpeakers] = useState<string[]>([]);
    const [spkFilter, setSpkFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [listLoading, setListLoading] = useState(false);
    const [error, setError] = useState(false);
    const [page, setPage] = useState(1);
    const PER_PAGE = 20;

    // Load speakers on mount
    useEffect(() => {
        apiFetch("/sermons/speakers")
            .then(d => {
                const raw: any[] = Array.isArray(d) ? d : (d?.speakers || d?.data || []);
                setSpeakers(raw.map((s: any) => typeof s === "string" ? s : s.speaker).filter(Boolean));
            })
            .catch(() => {
                // Fallback: extract from sermon list
                apiFetch("/sermons?limit=500")
                    .then(d => {
                        const arr = toArr(d);
                        const unique = [...new Set(arr.map((s: any) => s.speaker).filter(Boolean))].sort() as string[];
                        setSpeakers(unique);
                    }).catch(() => { });
            });
    }, []);

    // Load sermons when speaker filter changes
    useEffect(() => {
        setListLoading(true); setError(false); setPage(1);
        const path = spkFilter === "ALL"
            ? "/sermons?limit=500"
            : `/sermons?speaker=${encodeURIComponent(spkFilter)}&limit=500`;

        apiFetch(path)
            .then(d => setAllSermons(toArr(d)))
            .catch(() => setError(true))
            .finally(() => { setLoading(false); setListLoading(false); });
    }, [spkFilter]);

    const filtered = allSermons.filter(s => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            s.sermon_title?.toLowerCase().includes(q) ||
            s.title?.toLowerCase().includes(q) ||
            s.scripture_reference?.toLowerCase().includes(q) ||
            s.series?.toLowerCase().includes(q) ||
            s.speaker?.toLowerCase().includes(q)
        );
    });
    const paged = filtered.slice(0, page * PER_PAGE);

    if (view === "detail" && selectedSermon) {
        return (
            <div className="w-full max-w-5xl mx-auto py-12 px-6">
                <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(15px)}to{opacity:1;transform:translateY(0)}}`}</style>
                <SermonDetail
                    sermon={selectedSermon}
                    onBack={() => { setView("list"); setSelectedSermon(null); }}
                />
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto py-12 px-6">
            <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(15px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

            {/* SEO Metadata and Keywords (Visually Hidden) */}
            <div className="sr-only">
                <h1>Christian Sermons and Biblical Teachings</h1>
                <h2>Anointed Messages for Daily Spiritual Growth</h2>
                <p>Explore our vast collection of free apostolic teaching, prophetic messages, and scripture-based sermons. Study the Word of God with John Piper, Alistair Begg, and other anointed speakers.</p>
                <p>Keywords: Bible study archives, online church messages, spiritual nourishment, gospel preaching, salvation messages.</p>
            </div>

            {/* Header */}
            <div style={{ marginBottom: "20px" }}>
                <h2 style={{
                    fontFamily: "Cinzel, serif",
                    fontSize: "32px", fontWeight: "700", color: "#0d0d12", margin: "0 0 4px 0"
                }}>
                    Sermon Library
                </h2>
                <p style={{ color: "#aaa", fontSize: "14px", margin: "0", fontWeight: "500" }}>
                    {loading ? "Loading..." : `${filtered.length} sermon${filtered.length !== 1 ? "s" : ""}${spkFilter !== "ALL" ? ` · ${spkFilter}` : ""}`}
                </p>
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: "24px", maxWidth: "480px" }}>
                <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#bbb" }}>
                    <SearchIcon />
                </div>
                <input
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search sermons, scriptures, series..."
                    style={{
                        width: "100%", background: "white", border: "1px solid #e0dbd0",
                        borderRadius: "50px", padding: "12px 20px 12px 42px",
                        fontFamily: "sans-serif", fontSize: "15px", color: "#333",
                        outline: "none", boxSizing: "border-box" as const,
                        boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
                    }}
                />
            </div>

            {/* Speaker filter tags */}
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "10px", marginBottom: "32px" }}>
                <button
                    onClick={() => { setSpkFilter("ALL"); setPage(1); }}
                    style={{
                        padding: "8px 22px", borderRadius: "50px", fontSize: "14px",
                        fontFamily: "sans-serif", fontWeight: spkFilter === "ALL" ? "600" : "500",
                        cursor: "pointer",
                        border: `1.5px solid ${spkFilter === "ALL" ? "#0d0d12" : "#ddd"}`,
                        background: spkFilter === "ALL" ? "#0d0d12" : "white",
                        color: spkFilter === "ALL" ? "white" : "#555",
                        transition: "all 0.2s"
                    }}
                >
                    All Speakers
                </button>

                {speakers.map(spk => {
                    const active = spkFilter === spk;
                    const col = speakerHue(spk);
                    return (
                        <button key={spk}
                            onClick={() => { setSpkFilter(spk); setPage(1); }}
                            style={{
                                display: "inline-flex", alignItems: "center", gap: "8px",
                                padding: "8px 18px 8px 10px", borderRadius: "50px", fontSize: "14px",
                                fontFamily: "sans-serif", cursor: "pointer",
                                border: `1.5px solid ${active ? col : "#e0ddd6"}`,
                                background: active ? col : "white",
                                color: active ? "white" : "#444",
                                fontWeight: active ? "600" : "500",
                                boxShadow: active ? `0 4px 15px ${col}40` : "none",
                                transition: "all 0.2s"
                            }}
                        >
                            <span style={{
                                width: "24px", height: "24px", borderRadius: "50%",
                                background: active ? "rgba(255,255,255,0.3)" : col,
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                fontSize: "10px", fontWeight: "700", color: "white", flexShrink: 0
                            }}>
                                {initials(spk)}
                            </span>
                            {spk}
                        </button>
                    );
                })}
            </div>

            {/* States */}
            {(loading || listLoading) && (
                <div style={{ textAlign: "center", padding: "80px 20px" }}>
                    <div style={{ fontSize: "32px", marginBottom: "16px", animation: "spin 4s linear infinite", display: "inline-block" }}>✝</div>
                    <div style={{ color: "#bbb", fontSize: "14px", letterSpacing: "2.5px", fontWeight: "600" }}>OPENING THE LIBRARY</div>
                </div>
            )}

            {error && !loading && (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <p style={{ color: "#888", fontSize: "15px", fontFamily: "serif", fontStyle: "italic" }}>
                        ⚠️ The sacred archives are momentarily hushed. Please try again.
                    </p>
                </div>
            )}

            {!loading && !listLoading && !error && filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#bbb", fontSize: "15px", fontFamily: "serif", fontStyle: "italic" }}>
                    No messages found{search ? ` for "${search}"` : ""}.
                </div>
            )}

            {/* Sermon list */}
            {!loading && !listLoading && !error && filtered.length > 0 && (
                <>
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>
                        {paged.map((sermon: any, i: number) => (
                            <SermonCard
                                key={sermon._id || sermon.id || i}
                                sermon={sermon}
                                index={i}
                                showSpeaker={spkFilter === "ALL"}   // ← shows speaker badge only on ALL view
                                onClick={() => { setSelectedSermon(sermon); setView("detail"); }}
                            />
                        ))}
                    </div>

                    {paged.length < filtered.length && (
                        <div style={{ textAlign: "center", marginTop: "32px" }}>
                            <button onClick={() => setPage(p => p + 1)} style={{
                                background: "white", border: "2px solid #ddd",
                                borderRadius: "50px", padding: "12px 40px",
                                fontFamily: "sans-serif", fontSize: "14px",
                                color: "#555", fontWeight: "700", cursor: "pointer", transition: "all 0.3s"
                            }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0d0d12"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#ddd"; }}
                            >
                                LOAD MORE ARCHIVES · {filtered.length - paged.length} REMAINING
                            </button>
                        </div>
                    )}

                    <div style={{ textAlign: "center", marginTop: "24px", color: "#ccc", fontSize: "11px", letterSpacing: "1.5px", fontWeight: "700" }}>
                        OFFERING {paged.length} OF {filtered.length} MESSAGES
                    </div>
                </>
            )}
        </div>
    );
}
