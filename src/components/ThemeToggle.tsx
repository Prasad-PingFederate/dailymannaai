// src/components/ThemeToggle.tsx
"use client";

import { useTheme } from "@/context/ThemeContext";

interface ThemeToggleProps {
    variant?: "icon" | "pill"; // icon = toggle switch, pill = with label
}

export default function ThemeToggle({ variant = "icon" }: ThemeToggleProps) {
    const { theme, toggleTheme, isDark } = useTheme();

    if (variant === "pill") {
        return (
            <button
                onClick={toggleTheme}
                aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: "20px",
                    padding: "6px 14px",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    fontFamily: "sans-serif",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-gold)";
                    e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-primary)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                }}
            >
                <span style={{ fontSize: "14px" }}>{isDark ? "☀️" : "🌙"}</span>
                {isDark ? "Light" : "Dark"}
            </button>
        );
    }

    // ── Toggle switch (icon variant — default) ─────────────────────────────────
    return (
        <button
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
            style={{
                position: "relative",
                width: "52px",
                height: "28px",
                borderRadius: "14px",
                background: isDark ? "#D4A01733" : "var(--bg-input)",
                border: `1px solid ${isDark ? "#D4A01766" : "var(--border-primary)"}`,
                cursor: "pointer",
                padding: 0,
                flexShrink: 0,
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
            }}
        >
            {/* Track icons */}
            <span style={{
                position: "absolute",
                left: "6px",
                fontSize: "12px",
                opacity: isDark ? 1 : 0,
                transition: "opacity 0.2s",
                userSelect: "none",
            }}>☀️</span>
            <span style={{
                position: "absolute",
                right: "6px",
                fontSize: "12px",
                opacity: isDark ? 0 : 1,
                transition: "opacity 0.2s",
                userSelect: "none",
            }}>🌙</span>

            {/* Sliding knob */}
            <div style={{
                position: "absolute",
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: "var(--toggle-knob)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                transform: isDark ? "translateX(26px)" : "translateX(2px)",
            }} />
        </button>
    );
}
