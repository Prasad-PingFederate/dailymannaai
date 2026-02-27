"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────
//  CONSTANTS & DATA
// ─────────────────────────────────────────────

const THEMES = [
    {
        id: "golgotha",
        name: "Golgotha",
        description: "The Cross at Calvary",
        bg: ["#0a0a0f", "#1a0a2e", "#2d1b4e"],
        accent: "#c9a84c",
        text: "#f5e6c8",
        sub: "#d4af7a",
        glow: "rgba(201,168,76,0.3)",
    },
    {
        id: "dawn",
        name: "New Dawn",
        description: "His Mercies Are New",
        bg: ["#1a0533", "#8b2fc9", "#f97316"],
        accent: "#fbbf24",
        text: "#fff7ed",
        sub: "#fed7aa",
        glow: "rgba(251,191,36,0.35)",
    },
    {
        id: "seaofgalilee",
        name: "Sea of Galilee",
        description: "Walk on Water",
        bg: ["#0c1445", "#1e3a5f", "#0e7490"],
        accent: "#38bdf8",
        text: "#e0f2fe",
        sub: "#bae6fd",
        glow: "rgba(56,189,248,0.3)",
    },
    {
        id: "eden",
        name: "Garden of Eden",
        description: "In the Beginning",
        bg: ["#052e16", "#14532d", "#15803d"],
        accent: "#86efac",
        text: "#f0fdf4",
        sub: "#bbf7d0",
        glow: "rgba(134,239,172,0.3)",
    },
    {
        id: "heavenly",
        name: "Heavenly Realm",
        description: "As It Is in Heaven",
        bg: ["#0f172a", "#1e3a8a", "#3730a3"],
        accent: "#a5b4fc",
        text: "#eef2ff",
        sub: "#c7d2fe",
        glow: "rgba(165,180,252,0.35)",
    },
    {
        id: "desert",
        name: "Wilderness",
        description: "40 Days in the Desert",
        bg: ["#1c0a00", "#7c2d12", "#c2410c"],
        accent: "#fb923c",
        text: "#fff7ed",
        sub: "#fed7aa",
        glow: "rgba(251,146,60,0.3)",
    },
];

const CATEGORIES = [
    { id: "faith", label: "Faith & Trust", icon: "✝" },
    { id: "love", label: "God's Love", icon: "♥" },
    { id: "strength", label: "Strength", icon: "⚔" },
    { id: "peace", label: "Peace & Rest", icon: "☮" },
    { id: "salvation", label: "Salvation", icon: "★" },
    { id: "wisdom", label: "Wisdom", icon: "◈" },
    { id: "prayer", label: "Prayer", icon: "🙏" },
    { id: "hope", label: "Hope", icon: "⚡" },
];

const SIZES = [
    { id: "square", label: "Square", w: 1080, h: 1080, icon: "■" },
    { id: "story", label: "Story", w: 1080, h: 1920, icon: "▮" },
    { id: "wide", label: "Wide", w: 1920, h: 1080, icon: "▬" },
    { id: "post", label: "Post", w: 1200, h: 630, icon: "▭" },
];

const FONTS = [
    { id: "serif", label: "Trajan", family: "Georgia, 'Times New Roman', serif" },
    { id: "modern", label: "Modern", family: "'Palatino Linotype', Palatino, serif" },
    { id: "elegant", label: "Elegant", family: "Garamond, Baskerville, 'Book Antiqua', serif" },
];

// ─────────────────────────────────────────────
//  CANVAS RENDERING ENGINE
// ─────────────────────────────────────────────

function drawCross(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string, alpha = 0.15) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const armW = size * 0.12;
    const vH = size;
    const hW = size * 0.6;
    const hTop = size * 0.28;

    const grad = ctx.createLinearGradient(cx - hW / 2, cy - vH / 2, cx + hW / 2, cy + vH / 2);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(0.3, color);
    grad.addColorStop(0.7, color);
    grad.addColorStop(1, "transparent");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(cx - armW / 2, cy - vH / 2, armW, vH, armW * 0.3);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(cx - hW / 2, cy - vH / 2 + hTop, hW, armW, armW * 0.3);
    ctx.fill();
    ctx.restore();
}

function drawGlowOrb(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, color.replace(")", ", 0.6)").replace("rgb", "rgba"));
    g.addColorStop(0.5, color.replace(")", ", 0.15)").replace("rgb", "rgba"));
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
}

function drawStarfield(ctx: CanvasRenderingContext2D, w: number, h: number, count = 60) {
    ctx.save();
    for (let i = 0; i < count; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h * 0.6;
        const r = Math.random() * 1.5 + 0.3;
        const a = Math.random() * 0.7 + 0.2;
        ctx.globalAlpha = a;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawRays(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, color: string) {
    ctx.save();
    ctx.globalAlpha = 0.07;
    const numRays = 16;
    for (let i = 0; i < numRays; i++) {
        const angle = (i / numRays) * Math.PI * 2;
        const spread = 0.025;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, Math.max(w, h) * 1.5, angle - spread, angle + spread);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }
    ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
    const words = text.split(" ");
    const lines = [];
    let current = "";
    for (const word of words) {
        const test = current ? current + " " + word : word;
        if (ctx.measureText(test).width > maxWidth && current) {
            lines.push(current);
            current = word;
        } else {
            current = test;
        }
    }
    if (current) lines.push(current);
    return lines;
}

function renderBibleImage(canvas: HTMLCanvasElement, { quote, reference, theme, size, fontFamily, category }: any) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = size;
    canvas.width = w;
    canvas.height = h;

    const isStory = h > w;
    const isWide = w > h * 1.4;

    // ── Background gradient ──
    const bgGrad = ctx.createLinearGradient(0, 0, w * 0.3, h);
    theme.bg.forEach((c: string, i: number) => bgGrad.addColorStop(i / (theme.bg.length - 1), c));
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // ── Starfield for dark themes ──
    if (["golgotha", "heavenly", "dawn"].includes(theme.id)) {
        drawStarfield(ctx, w, h, isStory ? 80 : 50);
    }

    // ── Atmospheric glow orbs ──
    const orbSize = Math.min(w, h) * 0.7;
    drawGlowOrb(ctx, w * 0.15, h * 0.2, orbSize * 0.8, theme.glow);
    drawGlowOrb(ctx, w * 0.85, h * 0.75, orbSize * 0.6, theme.glow);

    // ── Light rays from cross center ──
    const crossCX = isWide ? w * 0.82 : w * 0.5;
    const crossCY = isWide ? h * 0.5 : isStory ? h * 0.22 : h * 0.28;
    drawRays(ctx, crossCX, crossCY, w, h, theme.accent);

    // ── Large background cross ──
    const crossSize = Math.min(w, h) * (isWide ? 0.7 : 0.55);
    drawCross(ctx, crossCX, crossCY, crossSize, theme.accent, 0.18);

    // ── Foreground cross (medium) ──
    drawCross(ctx, crossCX, crossCY, crossSize * 0.5, theme.accent, 0.35);

    // ── Decorative border ──
    const pad = Math.min(w, h) * 0.03;
    const bw = 1.5;
    ctx.save();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = bw;
    ctx.globalAlpha = 0.5;
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
    ctx.globalAlpha = 0.2;
    ctx.strokeRect(pad + 8, pad + 8, w - pad * 2 - 16, h - pad * 2 - 16);
    ctx.restore();

    // ── Corner ornaments ──
    const orn = Math.min(w, h) * 0.045;
    const corners = [
        [pad, pad],
        [w - pad, pad],
        [pad, h - pad],
        [w - pad, h - pad],
    ];
    ctx.save();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    corners.forEach(([cx, cy]) => {
        const sx = cx === pad ? 1 : -1;
        const sy = cy === pad ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(cx + sx * orn, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + sy * orn);
        ctx.stroke();
    });
    ctx.restore();

    // ── Content zone ──
    const textX = isWide ? w * 0.06 : w * 0.5;
    const textMaxW = isWide ? w * 0.55 : w * 0.78;
    const textAlign = isWide ? "left" : "center";
    const textStartY = isStory ? h * 0.38 : isWide ? h * 0.2 : h * 0.42;

    ctx.textAlign = textAlign;
    ctx.textBaseline = "middle";

    // ── Category label ──
    const catIcon = CATEGORIES.find((c) => c.id === category)?.icon || "✝";
    const catLabel = CATEGORIES.find((c) => c.id === category)?.label || "Scripture";
    const catFontSize = Math.round(Math.min(w, h) * 0.022);
    ctx.font = `${catFontSize}px ${fontFamily}`;
    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = 0.9;
    ctx.letterSpacing = "3px";
    ctx.fillText(`${catIcon}  ${catLabel.toUpperCase()}  ${catIcon}`, textX, textStartY - catFontSize * 3);
    ctx.globalAlpha = 1;

    // ── Decorative line ──
    const lineW = textMaxW * 0.4;
    const lineY = textStartY - catFontSize * 1.5;
    const lineX = textAlign === "center" ? textX - lineW / 2 : textX;
    const lineGrad = ctx.createLinearGradient(lineX, lineY, lineX + lineW, lineY);
    lineGrad.addColorStop(0, "transparent");
    lineGrad.addColorStop(0.5, theme.accent);
    lineGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(lineX, lineY);
    ctx.lineTo(lineX + lineW, lineY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // ── Opening quote mark ──
    const quoteFontSize = Math.round(Math.min(w, h) * 0.16);
    ctx.font = `bold ${quoteFontSize}px Georgia, serif`;
    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = 0.15;
    const qOffset = textAlign === "center" ? textX - textMaxW * 0.4 : textX - 5;
    ctx.fillText("\u201C", qOffset, textStartY - quoteFontSize * 0.1);
    ctx.globalAlpha = 1;

    // ── Quote text ──
    const fontSize = Math.round(Math.min(w, h) * (isStory ? 0.042 : isWide ? 0.038 : 0.046));
    ctx.font = `italic ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = theme.text;

    const lines = wrapText(ctx, `"${quote}"`, textMaxW);
    const lineH = fontSize * 1.55;
    const totalH = lines.length * lineH;
    let qY = textStartY + fontSize * 0.5;

    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 2;

    lines.forEach((line, i) => {
        ctx.fillText(line, textX, qY + i * lineH);
    });

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // ── Reference ──
    const refY = qY + totalH + fontSize * 1.4;
    const refFontSize = Math.round(fontSize * 0.72);
    ctx.font = `bold ${refFontSize}px ${fontFamily}`;
    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = 1;
    ctx.fillText(`— ${reference}`, textX, refY);

    // ── Divider line below reference ──
    const divW = textMaxW * 0.25;
    const divX = textAlign === "center" ? textX - divW / 2 : textX;
    const divY = refY + refFontSize * 1.5;
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(divX, divY);
    ctx.lineTo(divX + divW, divY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // ── Brand watermark ──
    const brandSize = Math.round(Math.min(w, h) * 0.018);
    ctx.font = `${brandSize}px ${fontFamily}`;
    ctx.fillStyle = theme.sub;
    ctx.globalAlpha = 0.5;
    ctx.textAlign = "right";
    ctx.fillText("DailyMannaAI.com", w - pad * 2, h - pad * 1.8);
    ctx.globalAlpha = 1;

    // ── Small cross icon watermark ──
    ctx.textAlign = "left";
    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = 0.4;
    ctx.font = `${brandSize * 1.2}px serif`;
    ctx.fillText("✝", pad * 2, h - pad * 1.8);
    ctx.globalAlpha = 1;
}

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────

export default function BibleQuoteGenerator({ onClose }: { onClose?: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewRef = useRef<HTMLImageElement>(null);

    const [state, setState] = useState({
        quote: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
        reference: "John 3:16",
        reflection: "The greatest act of love the world has ever known.",
        testament: "New",
        category: "love",
        theme: THEMES[0],
        size: SIZES[0],
        font: FONTS[0],
        customTopic: "",
    });

    const [ui, setUi] = useState({
        loading: false,
        generating: false,
        error: null as string | null,
        generated: false,
        tab: "theme", // theme | size | font | topic
        copied: false,
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        renderBibleImage(canvas, {
            quote: state.quote,
            reference: state.reference,
            theme: state.theme,
            size: state.size,
            fontFamily: state.font.family,
            category: state.category,
        });

        const preview = previewRef.current;
        if (preview) {
            const previewCanvas = document.createElement("canvas");
            const maxPreviewW = 520;
            const scale = maxPreviewW / state.size.w;
            previewCanvas.width = state.size.w * scale;
            previewCanvas.height = state.size.h * scale;
            const pCtx = previewCanvas.getContext("2d");
            if (pCtx) {
                pCtx.scale(scale, scale);
                pCtx.drawImage(canvas, 0, 0);
                preview.src = previewCanvas.toDataURL("image/png");
            }
        }
    }, [state]);

    const handleGenerate = useCallback(async () => {
        setUi((u) => ({ ...u, loading: true, error: null }));
        try {
            const response = await fetch('/api/bible-quote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: state.category, customTopic: state.customTopic }),
            });
            if (!response.ok) throw new Error('API call failed');
            const result = await response.json();

            setState((s) => ({
                ...s,
                quote: result.quote,
                reference: result.reference,
                reflection: result.reflection || "",
                testament: result.testament || "",
            }));
            setUi((u) => ({ ...u, loading: false, generated: true }));
        } catch (e) {
            setUi((u) => ({ ...u, loading: false, error: "Could not fetch verse. Please try again." }));
        }
    }, [state.category, state.customTopic]);

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        renderBibleImage(canvas, {
            quote: state.quote,
            reference: state.reference,
            theme: state.theme,
            size: state.size,
            fontFamily: state.font.family,
            category: state.category,
        });
        const link = document.createElement("a");
        link.download = `dailymanna-${state.reference.replace(/\s/g, "-").replace(":", "-")}-${Date.now()}.png`;
        link.href = canvas.toDataURL("image/png", 1.0);
        link.click();
    };

    const handleCopyImage = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.toBlob(async (blob) => {
            try {
                if (!blob) throw new Error("No blob generated");
                await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
                setUi((u) => ({ ...u, copied: true }));
                setTimeout(() => setUi((u) => ({ ...u, copied: false })), 2000);
            } catch {
                setUi((u) => ({ ...u, error: "Copy not supported. Please download instead." }));
            }
        });
    };

    const s = state;
    const currentTheme = s.theme;

    return (
        <div
            className="absolute inset-0 z-[120] bg-[#0a0a0f] text-[#f5e6c8] font-['Georgia',serif] overflow-y-auto"
        >
            {/* ── Header ── */}
            <div
                className="sticky top-0 z-10"
                style={{
                    background: "linear-gradient(180deg, #1a0a2e 0%, #0a0a0f 100%)",
                    borderBottom: "1px solid rgba(201,168,76,0.2)",
                    padding: "20px 32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 32, filter: "drop-shadow(0 0 10px rgba(201,168,76,0.8))" }}>✝</span>
                    <div>
                        <div
                            style={{
                                fontSize: 22,
                                fontWeight: "bold",
                                color: "#c9a84c",
                                letterSpacing: 1,
                                textShadow: "0 0 20px rgba(201,168,76,0.5)",
                            }}
                        >
                            DailyManna AI
                        </div>
                        <div style={{ fontSize: 11, color: "#8a7a5a", letterSpacing: 3, textTransform: "uppercase" }}>
                            Bible Quote Image Studio
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#8a7a5a] italic">
                    "Thy word is a lamp unto my feet" — Psalm 119:105
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 ml-4 bg-white/10 border border-white/20 rounded-full hover:bg-white/20 not-italic font-bold tracking-wider uppercase transition text-[#f5e6c8]"
                        >
                            Close Studio
                        </button>
                    )}
                </div>
            </div>

            <div
                style={{
                    maxWidth: 1280,
                    margin: "0 auto",
                    padding: "32px 24px",
                    display: "grid",
                    gridTemplateColumns: "1fr minmax(320px, 480px)",
                    gap: 32,
                    alignItems: "start",
                }}
            >
                {/* ─────────────── LEFT: CONTROLS ─────────────── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                    {/* Category selector */}
                    <div style={card as any}>
                        <SectionTitle icon="◈" title="Scripture Category" />
                        <div
                            className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2"
                        >
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setState((st) => ({ ...st, category: cat.id }))}
                                    style={{
                                        ...catBtn as any,
                                        background:
                                            s.category === cat.id
                                                ? "linear-gradient(135deg, #c9a84c22, #c9a84c44)"
                                                : "rgba(255,255,255,0.04)",
                                        border: `1px solid ${s.category === cat.id ? "#c9a84c" : "rgba(255,255,255,0.08)"}`,
                                        color: s.category === cat.id ? "#c9a84c" : "#8a8a8a",
                                        boxShadow: s.category === cat.id ? "0 0 16px rgba(201,168,76,0.2)" : "none",
                                    }}
                                >
                                    <span style={{ fontSize: 18, marginBottom: 4 }}>{cat.icon}</span>
                                    <span style={{ fontSize: 11 }}>{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom topic */}
                    <div style={card as any}>
                        <SectionTitle icon="✍" title="Custom Prayer Topic" />
                        <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                            <input
                                type="text"
                                placeholder="e.g. anxiety, marriage, career, healing..."
                                value={s.customTopic}
                                onChange={(e) => setState((st) => ({ ...st, customTopic: e.target.value }))}
                                style={{
                                    flex: 1,
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(201,168,76,0.25)",
                                    borderRadius: 8,
                                    padding: "10px 14px",
                                    color: "#f5e6c8",
                                    fontSize: 14,
                                    fontFamily: "Georgia, serif",
                                    outline: "none",
                                }}
                            />
                        </div>
                    </div>

                    {/* Generate button */}
                    <button
                        onClick={handleGenerate}
                        disabled={ui.loading}
                        style={{
                            background: ui.loading
                                ? "rgba(201,168,76,0.3)"
                                : "linear-gradient(135deg, #c9a84c, #f0c060, #c9a84c)",
                            border: "none",
                            borderRadius: 12,
                            padding: "18px 28px",
                            color: ui.loading ? "#8a7a5a" : "#1a0a2e",
                            fontSize: 16,
                            fontWeight: "bold",
                            fontFamily: "Georgia, serif",
                            cursor: ui.loading ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 10,
                            letterSpacing: 1,
                            boxShadow: ui.loading ? "none" : "0 4px 30px rgba(201,168,76,0.4)",
                            transition: "all 0.3s",
                        }}
                    >
                        {ui.loading ? (
                            <>
                                <span className="animate-spin inline-block">✝</span>
                                Searching the Scriptures...
                            </>
                        ) : (
                            <>✝ Generate Scripture Image</>
                        )}
                    </button>

                    {ui.error && (
                        <div
                            style={{
                                background: "rgba(239,68,68,0.1)",
                                border: "1px solid rgba(239,68,68,0.3)",
                                borderRadius: 8,
                                padding: "12px 16px",
                                color: "#fca5a5",
                                fontSize: 13,
                            }}
                        >
                            ⚠ {ui.error}
                        </div>
                    )}

                    {/* Tabs for theme/size/font */}
                    <div style={card as any}>
                        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 12 }}>
                            {["theme", "size", "font"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setUi((u) => ({ ...u, tab }))}
                                    style={{
                                        background: ui.tab === tab ? "rgba(201,168,76,0.15)" : "transparent",
                                        border: "none",
                                        borderBottom: ui.tab === tab ? "2px solid #c9a84c" : "2px solid transparent",
                                        color: ui.tab === tab ? "#c9a84c" : "#6a6a6a",
                                        padding: "6px 16px",
                                        fontSize: 13,
                                        cursor: "pointer",
                                        fontFamily: "Georgia, serif",
                                        textTransform: "capitalize",
                                        letterSpacing: 1,
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Theme tab */}
                        {ui.tab === "theme" && (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                {THEMES.map((theme) => (
                                    <button
                                        key={theme.id}
                                        onClick={() => setState((st) => ({ ...st, theme }))}
                                        style={{
                                            background: `linear-gradient(135deg, ${theme.bg[0]}, ${theme.bg[theme.bg.length - 1]})`,
                                            border: `2px solid ${s.theme.id === theme.id ? theme.accent : "transparent"}`,
                                            borderRadius: 10,
                                            padding: "12px 8px",
                                            cursor: "pointer",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: 4,
                                            boxShadow: s.theme.id === theme.id ? `0 0 20px ${theme.glow}` : "none",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        <span style={{ fontSize: 20, color: theme.accent }}>✝</span>
                                        <span style={{ fontSize: 11, color: theme.text, fontFamily: "Georgia, serif" }}>
                                            {theme.name}
                                        </span>
                                        <span style={{ fontSize: 9, color: theme.sub, opacity: 0.7 }}>
                                            {theme.description}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Size tab */}
                        {ui.tab === "size" && (
                            <div className="grid grid-cols-2 gap-2">
                                {SIZES.map((sz) => (
                                    <button
                                        key={sz.id}
                                        onClick={() => setState((st) => ({ ...st, size: sz }))}
                                        style={{
                                            background:
                                                s.size.id === sz.id
                                                    ? "rgba(201,168,76,0.12)"
                                                    : "rgba(255,255,255,0.03)",
                                            border: `1px solid ${s.size.id === sz.id ? "#c9a84c" : "rgba(255,255,255,0.08)"}`,
                                            borderRadius: 10,
                                            padding: "14px 16px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            color: s.size.id === sz.id ? "#c9a84c" : "#888",
                                        }}
                                    >
                                        <span style={{ fontSize: 22 }}>{sz.icon}</span>
                                        <div style={{ textAlign: "left" }}>
                                            <div style={{ fontSize: 13, fontFamily: "Georgia, serif" }}>{sz.label}</div>
                                            <div style={{ fontSize: 11, opacity: 0.6 }}>
                                                {sz.w}×{sz.h}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Font tab */}
                        {ui.tab === "font" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {FONTS.map((font) => (
                                    <button
                                        key={font.id}
                                        onClick={() => setState((st) => ({ ...st, font }))}
                                        style={{
                                            background:
                                                s.font.id === font.id
                                                    ? "rgba(201,168,76,0.12)"
                                                    : "rgba(255,255,255,0.03)",
                                            border: `1px solid ${s.font.id === font.id ? "#c9a84c" : "rgba(255,255,255,0.08)"}`,
                                            borderRadius: 10,
                                            padding: "14px 20px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            color: s.font.id === font.id ? "#c9a84c" : "#888",
                                        }}
                                    >
                                        <span style={{ fontSize: 13, fontFamily: "Georgia, serif" }}>{font.label}</span>
                                        <span style={{ fontFamily: font.family, fontSize: 18, opacity: 0.8 }}>
                                            "Grace"
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Manual quote editor */}
                    <div style={card as any}>
                        <SectionTitle icon="📖" title="Edit Scripture Text" />
                        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                            <textarea
                                value={s.quote}
                                onChange={(e) => setState((st) => ({ ...st, quote: e.target.value }))}
                                rows={4}
                                style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(201,168,76,0.2)",
                                    borderRadius: 8,
                                    padding: "12px 14px",
                                    color: "#f5e6c8",
                                    fontSize: 14,
                                    fontFamily: "Georgia, serif",
                                    fontStyle: "italic",
                                    resize: "vertical",
                                    lineHeight: 1.6,
                                    outline: "none",
                                }}
                            />
                            <input
                                type="text"
                                value={s.reference}
                                onChange={(e) => setState((st) => ({ ...st, reference: e.target.value }))}
                                placeholder="Reference (e.g. John 3:16)"
                                style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(201,168,76,0.2)",
                                    borderRadius: 8,
                                    padding: "10px 14px",
                                    color: "#c9a84c",
                                    fontSize: 14,
                                    fontFamily: "Georgia, serif",
                                    fontWeight: "bold",
                                    outline: "none",
                                }}
                            />
                            {s.reflection && (
                                <div
                                    style={{
                                        background: "rgba(201,168,76,0.05)",
                                        border: "1px solid rgba(201,168,76,0.15)",
                                        borderRadius: 8,
                                        padding: "10px 14px",
                                        fontSize: 13,
                                        color: "#a89050",
                                        fontStyle: "italic",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    <span style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#7a6a40" }}>
                                        Reflection ·{" "}
                                    </span>
                                    {s.reflection}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─────────────── RIGHT: PREVIEW ─────────────── */}
                <div className="sticky top-24 flex flex-col gap-4">

                    {/* Preview area */}
                    <div
                        style={{
                            background: "#111118",
                            borderRadius: 16,
                            padding: 16,
                            border: "1px solid rgba(201,168,76,0.15)",
                            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                color: "#555",
                                letterSpacing: 2,
                                textTransform: "uppercase",
                                marginBottom: 12,
                                paddingBottom: 8,
                                borderBottom: "1px solid rgba(255,255,255,0.06)",
                                display: "flex",
                                justifyContent: "space-between",
                            }}
                        >
                            <span>Preview</span>
                            <span style={{ color: "#4a4a4a" }}>
                                {s.size.w}×{s.size.h}px
                            </span>
                        </div>
                        <div
                            style={{
                                borderRadius: 10,
                                overflow: "hidden",
                                boxShadow: `0 8px 40px rgba(0,0,0,0.8), 0 0 60px ${currentTheme.glow}`,
                            }}
                        >
                            <img
                                ref={previewRef}
                                style={{ width: "100%", display: "block" }}
                                alt="Bible quote preview"
                            />
                        </div>
                    </div>

                    {/* Testament badge */}
                    {s.testament && (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                gap: 12,
                                alignItems: "center",
                            }}
                        >
                            <span
                                style={{
                                    background:
                                        s.testament === "Old"
                                            ? "rgba(251,191,36,0.1)"
                                            : "rgba(56,189,248,0.1)",
                                    border: `1px solid ${s.testament === "Old" ? "#fbbf24" : "#38bdf8"}`,
                                    borderRadius: 20,
                                    padding: "4px 14px",
                                    fontSize: 12,
                                    color: s.testament === "Old" ? "#fbbf24" : "#38bdf8",
                                    letterSpacing: 1,
                                }}
                            >
                                {s.testament} Testament
                            </span>
                            <span
                                style={{
                                    background: "rgba(134,239,172,0.1)",
                                    border: "1px solid rgba(134,239,172,0.3)",
                                    borderRadius: 20,
                                    padding: "4px 14px",
                                    fontSize: 12,
                                    color: "#86efac",
                                    letterSpacing: 1,
                                }}
                            >
                                ✝ {s.reference}
                            </span>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 10 }}>
                        <button
                            onClick={handleDownload}
                            style={{
                                flex: 1,
                                background: "linear-gradient(135deg, #c9a84c, #f0c060)",
                                border: "none",
                                borderRadius: 10,
                                padding: "14px",
                                color: "#1a0a2e",
                                fontSize: 14,
                                fontWeight: "bold",
                                fontFamily: "Georgia, serif",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                                boxShadow: "0 4px 20px rgba(201,168,76,0.3)",
                            }}
                        >
                            ⬇ Download PNG
                        </button>
                        <button
                            onClick={handleCopyImage}
                            style={{
                                flex: 1,
                                background: "rgba(201,168,76,0.1)",
                                border: "1px solid rgba(201,168,76,0.3)",
                                borderRadius: 10,
                                padding: "14px",
                                color: ui.copied ? "#86efac" : "#c9a84c",
                                fontSize: 14,
                                fontFamily: "Georgia, serif",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                                transition: "all 0.2s",
                            }}
                        >
                            {ui.copied ? "✓ Copied!" : "⧉ Copy Image"}
                        </button>
                    </div>

                    {/* Share tip */}
                    <div
                        style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: 10,
                            padding: "12px 16px",
                            fontSize: 12,
                            color: "#555",
                            lineHeight: 1.6,
                            textAlign: "center",
                        }}
                    >
                        📱 Perfect for Instagram, WhatsApp, Facebook & Church bulletins
                        <br />
                        <span style={{ color: "#3a3a3a" }}>
                            Share the Word — "Go into all the world" — Mark 16:15
                        </span>
                    </div>
                </div>
            </div>

            {/* Hidden full-res canvas */}
            <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
    );
}

// ─────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────

function SectionTitle({ icon, title }: { icon: string, title: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#c9a84c", fontSize: 16 }}>{icon}</span>
            <span
                style={{
                    fontSize: 13,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: "#a89050",
                    fontFamily: "Georgia, serif",
                }}
            >
                {title}
            </span>
        </div>
    );
}

// ─────────────────────────────────────────────
//  STYLE CONSTANTS
// ─────────────────────────────────────────────

const card = {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(201,168,76,0.1)",
    borderRadius: 14,
    padding: "20px 22px",
    backdropFilter: "blur(10px)",
};

const catBtn = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "12px 8px",
    borderRadius: 10,
    cursor: "pointer",
    fontFamily: "Georgia, serif",
    transition: "all 0.2s",
    gap: 4,
};
