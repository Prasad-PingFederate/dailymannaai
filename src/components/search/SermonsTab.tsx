"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface SermonSummary {
  id: string;
  title: string;
  author: string;
  initials: string;
  category: string;
  duration?: string;
  hasAudio: boolean;
  preview: string;
}

interface SermonDetail {
  id: string;
  title: string;
  author: string;
  scripture?: string;
  audioUrl?: string;
  fullText: string;
  keyPoints?: string[];
  category: string;
  duration?: string;
  publishedAt?: string;
}

// ─── Category colours ─────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  Salvation: "#1a6fa8",
  Teaching: "#B8860B",
  Faith: "#6B4CA8",
  Prayer: "#2E7D52",
  Evangelism: "#C0672A",
  General: "#555",
  Default: "#555",
};

function getColor(category: string) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.Default;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ initials }: { initials: string }) {
  return (
    <div style={{
      width: 48, height: 48, borderRadius: 12,
      background: "#1a2235", color: "white",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, fontWeight: 700, flexShrink: 0,
      fontFamily: "sans-serif", letterSpacing: "0.05em",
    }}>
      {initials}
    </div>
  );
}

// ─── Skeleton loader for cards ────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: "white", border: "1px solid #ebebeb",
      borderRadius: 16, padding: "20px 24px",
      display: "flex", flexDirection: "column" as const, gap: 12,
    }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f0f0f0" }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 16, background: "#f0f0f0", borderRadius: 6, marginBottom: 8, width: "60%" }} />
          <div style={{ height: 12, background: "#f5f5f5", borderRadius: 6, width: "35%" }} />
        </div>
      </div>
      <div style={{ height: 12, background: "#f5f5f5", borderRadius: 6, width: "80%" }} />
      <div style={{ height: 12, background: "#f5f5f5", borderRadius: 6, width: "50%" }} />
      <style>{`
        @keyframes shimmer {
          0%   { opacity: 1; }
          50%  { opacity: 0.5; }
          100% { opacity: 1; }
        }
        div[data-skeleton] { animation: shimmer 1.4s ease infinite; }
      `}</style>
    </div>
  );
}

// ─── Sermon Card ──────────────────────────────────────────────────────────────
function SermonCard({ sermon, onClick }: { sermon: SermonSummary; onClick: () => void }) {
  const color = getColor(sermon.category);
  return (
    <div
      onClick={onClick}
      style={{
        background: "white", border: "1px solid #ebebeb",
        borderRadius: 16, padding: "20px 24px",
        cursor: "pointer", transition: "all 0.2s",
        display: "flex", flexDirection: "column" as const, gap: 12,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.borderColor = "#d0d0d0";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.borderColor = "#ebebeb";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <Avatar initials={sermon.initials} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 2, lineHeight: 1.3 }}>
            {sermon.title}
          </div>
          <div style={{ fontSize: 13, color: "#888", fontFamily: "sans-serif" }}>
            {sermon.author}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          <span style={{
            background: `${color}15`, color, border: `1px solid ${color}30`,
            borderRadius: 20, padding: "3px 10px",
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase" as const, fontFamily: "sans-serif",
          }}>
            {sermon.category}
          </span>
          {sermon.hasAudio && sermon.duration && (
            <span style={{ fontSize: 11, color: "#888", fontFamily: "sans-serif" }}>
              🎧 {sermon.duration}
            </span>
          )}
        </div>
      </div>

      <p style={{ fontSize: 13, color: "#777", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
        {sermon.preview}
      </p>

      <span style={{ fontSize: 12, color, fontFamily: "sans-serif", fontWeight: 600 }}>
        {sermon.hasAudio ? "▶ Listen & Read →" : "Read Full Sermon →"}
      </span>
    </div>
  );
}

// ─── Audio Player ─────────────────────────────────────────────────────────────
function AudioPlayer({ url }: { url: string }) {
  return (
    <div style={{
      background: "#f5f7fa", border: "1px solid #e0e0e0",
      borderRadius: 12, padding: "14px 20px",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <span style={{ fontSize: 20 }}>🎧</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 4, fontFamily: "sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
          Audio Sermon
        </div>
        <audio controls style={{ width: "100%", height: 36 }} src={url}>
          Your browser does not support audio.
        </audio>
      </div>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ padding: "60px 0", textAlign: "center" as const }}>
      <div style={{
        width: 36, height: 36, border: "3px solid #e0e0e0",
        borderTopColor: "#1a6fa8", borderRadius: "50%",
        animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
      }} />
      <div style={{ color: "#999", fontSize: 13, fontFamily: "sans-serif" }}>
        Loading sermon...
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Error Banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{
      background: "#fff5f5", border: "1px solid #ffcccc",
      borderRadius: 12, padding: "16px 20px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12,
    }}>
      <span style={{ color: "#c00", fontSize: 14, fontFamily: "sans-serif" }}>
        ⚠ {message}
      </span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: "white", border: "1px solid #ffaaaa", color: "#c00",
            borderRadius: 8, padding: "6px 14px", fontSize: 12,
            cursor: "pointer", fontFamily: "sans-serif",
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SermonsTab() {
  // ── List state ──────────────────────────────────────────────────────────────
  const [sermons, setSermons] = useState<SermonSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  // ── Detail state ────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<SermonSummary | null>(null);
  const [detail, setDetail] = useState<SermonDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // ── 1. Fetch lightweight sermon list on mount ────────────────────────────
  //       No full_text here — just titles, authors, previews
  const fetchList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await fetch("https://www.dailymannaai.com/api/sermons");          // → api-sermons-route.ts
      if (!res.ok) throw new Error("Failed to load sermons");
      const data = await res.json();
      setSermons(data.sermons || []);
    } catch (e: any) {
      setListError(e.message || "Could not load sermons. Please try again.");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // ── 2. Fetch SINGLE sermon detail — called ONLY on card click ────────────
  const handleSermonClick = useCallback(async (sermon: SermonSummary) => {
    setSelected(sermon);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const res = await fetch(`https://www.dailymannaai.com/api/sermons/${sermon.id}`); // → api-sermons-[id]-route.ts
      if (!res.ok) throw new Error("Could not load this sermon");
      const data = await res.json();
      // Backend returns the sermon object directly (not wrapped in { sermon: ... })
      setDetail(data.sermon ?? data);
    } catch (e: any) {
      setDetailError(e.message || "Could not load sermon. Please try again.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const retryDetail = useCallback(() => {
    if (selected) handleSermonClick(selected);
  }, [selected, handleSermonClick]);

  // ── Categories derived from fetched data ──────────────────────────────────
  const categories = ["All", ...Array.from(new Set(sermons.map((s) => s.category)))];
  const filtered = activeCategory === "All"
    ? sermons
    : sermons.filter((s) => s.category === activeCategory);

  // ════════════════════════════════════════════════════════════════
  // DETAIL VIEW
  // ════════════════════════════════════════════════════════════════
  if (selected) {
    const color = getColor(selected.category);
    return (
      <div style={{ background: "#f9f9f7", minHeight: "100vh", fontFamily: "Georgia, serif" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px 80px" }}>

          {/* Back */}
          <button
            onClick={() => { setSelected(null); setDetail(null); }}
            style={{
              background: "white", border: "1px solid #e0e0e0", borderRadius: 10,
              padding: "9px 18px", cursor: "pointer", fontSize: 13, color: "#555",
              display: "flex", alignItems: "center", gap: 6,
              marginBottom: 28, fontFamily: "sans-serif", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "#aaa"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e0e0e0"}
          >
            ← Back to Sermons
          </button>

          {/* Header */}
          <div style={{
            background: "white", border: "1px solid #ebebeb",
            borderRadius: 16, padding: "28px 32px", marginBottom: 24,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Avatar initials={selected.initials} />
              <div>
                <h1 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 600, color: "#1a1a1a", margin: 0, lineHeight: 1.3 }}>
                  {selected.title}
                </h1>
                <div style={{ fontSize: 14, color: "#888", marginTop: 4, fontFamily: "sans-serif" }}>
                  {selected.author}
                  {selected.duration && <span style={{ marginLeft: 12 }}>· 🎧 {selected.duration}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* States */}
          {detailLoading && <Spinner />}
          {detailError && <ErrorBanner message={detailError} onRetry={retryDetail} />}

          {/* ── Detail content — rendered only after AstraDB responds ── */}
          {detail && !detailLoading && (
            <div style={{ animation: "fadeUp 0.35s ease both" }}>

              {/* Audio */}
              {detail.audioUrl && (
                <div style={{ marginBottom: 24 }}>
                  <AudioPlayer url={detail.audioUrl} />
                </div>
              )}

              {/* Scripture */}
              {detail.scripture && (
                <div style={{
                  background: `${color}0d`, border: `1px solid ${color}25`,
                  borderLeft: `4px solid ${color}`,
                  borderRadius: "0 12px 12px 0",
                  padding: "14px 20px", marginBottom: 24,
                  fontSize: 14, color: "#444", fontStyle: "italic", fontFamily: "sans-serif",
                }}>
                  📖 Key Scripture: <strong style={{ color }}>{detail.scripture}</strong>
                </div>
              )}

              {/* Key Points */}
              {detail.keyPoints && detail.keyPoints.length > 0 && (
                <div style={{
                  background: "white", border: "1px solid #ebebeb",
                  borderRadius: 14, padding: "20px 24px", marginBottom: 24,
                }}>
                  <div style={{
                    fontSize: 10, letterSpacing: "0.2em", color: "#aaa",
                    textTransform: "uppercase" as const, marginBottom: 12, fontFamily: "sans-serif",
                  }}>
                    Key Points
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column" as const, gap: 8 }}>
                    {detail.keyPoints.map((pt, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#444", lineHeight: 1.5 }}>
                        <span style={{ color, flexShrink: 0, marginTop: 2 }}>✦</span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Full Text */}
              <div style={{
                background: "white", border: "1px solid #ebebeb",
                borderRadius: 16, padding: "28px 32px",
              }}>
                <div style={{
                  fontSize: 10, letterSpacing: "0.2em", color: "#aaa",
                  textTransform: "uppercase" as const, marginBottom: 20,
                  fontFamily: "sans-serif",
                }}>
                  🎙 Sermon Message
                </div>
                <div style={{ fontSize: 15, color: "#333", lineHeight: 1.95, whiteSpace: "pre-line" as const }}>
                  {detail.fullText}
                </div>
              </div>

              {/* Share */}
              <div style={{
                marginTop: 24, background: "white", border: "1px solid #e8e8e8",
                borderRadius: 14, padding: "18px 24px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexWrap: "wrap" as const, gap: 12,
              }}>
                <span style={{ fontSize: 13, color: "#888", fontFamily: "sans-serif" }}>
                  Share this sermon
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      const text = `${selected.title} — ${selected.author}\nhttps://www.dailymannaai.com/sermons/${selected.id}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                    }}
                    style={{
                      background: "#25D36615", border: "1px solid #25D36633",
                      color: "#128C7E", borderRadius: 8, padding: "7px 14px",
                      fontSize: 12, cursor: "pointer", fontFamily: "sans-serif", fontWeight: 600,
                    }}
                  >
                    📲 WhatsApp
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(
                      `${selected.title} — ${selected.author}\nhttps://www.dailymannaai.com/sermons/${selected.id}`
                    )}
                    style={{
                      background: "#f5f5f5", border: "1px solid #e0e0e0",
                      color: "#555", borderRadius: 8, padding: "7px 14px",
                      fontSize: 12, cursor: "pointer", fontFamily: "sans-serif",
                    }}
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(14px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // LIST VIEW  — no sermon APIs called here, only /api/sermons list
  // ════════════════════════════════════════════════════════════════
  return (
    <div style={{ background: "#f9f9f7", minHeight: "100vh", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 400, fontStyle: "italic", color: "#1a1a1a", marginBottom: 8 }}>
            Sermon Library
          </h1>
          <p style={{ color: "#888", fontSize: 14, fontFamily: "sans-serif" }}>
            {listLoading ? "Loading..." : `${sermons.length} sermons · Click any sermon to read or listen`}
          </p>
        </div>

        {/* Category Filters */}
        {!listLoading && !listError && (
          <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" as const }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  background: activeCategory === cat ? "#1a2235" : "white",
                  color: activeCategory === cat ? "white" : "#555",
                  border: "1px solid " + (activeCategory === cat ? "#1a2235" : "#e0e0e0"),
                  borderRadius: 20, padding: "6px 16px",
                  fontSize: 12, cursor: "pointer", fontFamily: "sans-serif",
                  fontWeight: activeCategory === cat ? 600 : 400, transition: "all 0.2s",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* List error */}
        {listError && <ErrorBanner message={listError} onRetry={fetchList} />}

        {/* Skeleton loading state */}
        {listLoading && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Sermon cards — clicking one triggers the single-sermon API */}
        {!listLoading && !listError && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
            {filtered.map((sermon) => (
              <SermonCard
                key={sermon.id}
                sermon={sermon}
                onClick={() => handleSermonClick(sermon)}  // ← AstraDB detail API fires here only
              />
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: "center" as const, padding: "60px 0", color: "#bbb", fontFamily: "sans-serif" }}>
                No sermons in this category yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
