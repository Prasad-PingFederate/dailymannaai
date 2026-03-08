// src/components/UserMenu.tsx
"use client";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useState } from "react";

export default function UserMenu() {
    const { user, loading, logout, isLoggedIn } = useAuth();
    const [open, setOpen] = useState(false);

    if (loading) return <div style={{ width: 80, height: 32, borderRadius: 8, background: "rgba(0,0,0,0.05)" }} />;

    if (!isLoggedIn) return (
        <Link href="/auth/signin?callbackUrl=/" style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "#D4A017", color: "#0a0a10",
            border: "none", borderRadius: "8px",
            padding: "7px 16px", fontSize: "12px",
            fontWeight: 700, textDecoration: "none",
            fontFamily: "sans-serif", letterSpacing: "0.05em",
            transition: "all 0.2s", whiteSpace: "nowrap",
        }}>
            Sign In &#10022;
        </Link>
    );

    const initials = user!.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

    return (
        <div style={{ position: "relative" }}>
            <button onClick={() => setOpen(!open)} style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: "rgba(0,0,0,0.05)",
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: "20px", padding: "5px 12px 5px 5px",
                cursor: "pointer", color: "var(--text-secondary, #555)",
                fontSize: "13px", fontFamily: "sans-serif",
                transition: "all 0.2s",
            }}>
                <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: "#D4A017", color: "#0a0a10",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontWeight: 700, flexShrink: 0,
                }}>
                    {initials}
                </div>
                <span style={{ maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user!.name.split(" ")[0]}
                </span>
                <span style={{ fontSize: "10px", opacity: 0.5 }}>&#9662;</span>
            </button>

            {open && (
                <>
                    {/* Backdrop */}
                    <div style={{ position: "fixed", inset: 0, zIndex: 150 }} onClick={() => setOpen(false)} />
                    {/* Dropdown */}
                    <div style={{
                        position: "absolute", top: "calc(100% + 8px)", right: 0,
                        background: "var(--bg-card, #fff)",
                        border: "1px solid var(--border-secondary, #ebebeb)",
                        borderRadius: "14px", padding: "8px",
                        minWidth: 200, zIndex: 200,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                        animation: "fadeUp 0.15s ease",
                    }}>
                        {/* User info */}
                        <div style={{ padding: "8px 12px 12px", borderBottom: "1px solid var(--border-secondary, #ebebeb)", marginBottom: "6px" }}>
                            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary, #1a1a1a)", fontFamily: "sans-serif" }}>
                                {user!.name}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted, #888)", fontFamily: "sans-serif", marginTop: "2px" }}>
                                {user!.email}
                            </div>
                            <div style={{
                                display: "inline-block", marginTop: "6px",
                                background: "#D4A01720", border: "1px solid #D4A01740",
                                borderRadius: "10px", padding: "2px 8px",
                                fontSize: "10px", color: "#B8860B",
                                fontFamily: "sans-serif", letterSpacing: "0.08em", textTransform: "uppercase",
                            }}>
                                {user!.plan} plan
                            </div>
                        </div>

                        <button onClick={() => { setOpen(false); logout(); }} style={{
                            width: "100%", textAlign: "left",
                            background: "none", border: "none",
                            padding: "9px 12px", borderRadius: "8px",
                            fontSize: "13px", color: "#e53e3e",
                            cursor: "pointer", fontFamily: "sans-serif",
                            transition: "background 0.15s",
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#fff5f5"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                            &#128682; Sign Out
                        </button>
                    </div>
                </>
            )}
            <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }`}</style>
        </div>
    );
}
