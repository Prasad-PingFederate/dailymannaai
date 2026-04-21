// src/app/blog/types.ts

export interface Question {
    slug: string;
    question: string;
    category: string;
    keywords: string[];
    searchVolume: "high" | "medium";
    createdAt: string;
    metaDescription: string;
    answer?: string;
    shortAnswer?: string;
    keyVerse?: string;
}

export const CATEGORY_META: Record<string, { label: string; color: string; emoji: string }> = {
    salvation:     { label: "Salvation",     color: "#6366f1", emoji: "🕊️" },
    prayer:        { label: "Prayer",        color: "#0ea5e9", emoji: "🙏" },
    healing:       { label: "Healing",       color: "#22c55e", emoji: "💚" },
    faith:         { label: "Faith",         color: "#f59e0b", emoji: "🌿" },
    prophecy:      { label: "Prophecy",      color: "#ef4444", emoji: "🔥" },
    relationships: { label: "Relationships", color: "#ec4899", emoji: "💛" },
    suffering:     { label: "Suffering",     color: "#8b5cf6", emoji: "🌧️" },
    "holy-spirit": { label: "Holy Spirit",   color: "#06b6d4", emoji: "🕊️" },
    church:        { label: "Church",        color: "#10b981", emoji: "⛪" },
    bible:         { label: "Bible",         color: "#f97316", emoji: "📖" },
    jesus:         { label: "Jesus",         color: "#B8860B", emoji: "👑" },
    all:           { label: "General",       color: "#D4AF37", emoji: "✨" },
};
