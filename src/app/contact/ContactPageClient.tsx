// src/app/contact/ContactPageClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPageClient() {
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSending(true);
        // Opens default mail client with prefilled content
        const subject = encodeURIComponent("Message from DailyMannaAI Contact Form");
        const body = encodeURIComponent(
            `Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`
        );
        window.location.href = `mailto:support@dailymannaai.com?subject=${subject}&body=${body}`;
        setTimeout(() => {
            setSending(false);
            setSent(true);
        }, 800);
    }

    return (
        <main style={{
            minHeight: "100vh",
            background: "var(--bg-primary, #fff)",
            color: "var(--text-primary, #1a1a1a)",
            fontFamily: "Georgia, serif",
        }}>
            {/* Nav */}
            <nav style={{
                padding: "18px 40px",
                borderBottom: "1px solid var(--border-primary, #e8e8e8)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "var(--nav-bg, #fff)",
                position: "sticky", top: 0, zIndex: 50,
            }}>
                <Link href="/" style={{
                    fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 900,
                    textDecoration: "none", letterSpacing: "-0.02em",
                    color: "var(--logo-primary, #1a1a1a)",
                }}>
                    DAILY<span style={{
                        background: "linear-gradient(135deg, #B8860B 0%, #D4A017 40%, #F5C842 60%, #B8860B 100%)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                    }}>MANNA</span>AI
                </Link>
                <div style={{ display: "flex", gap: 24, fontSize: 14 }}>
                    <Link href="/" style={{ color: "var(--text-secondary, #555)", textDecoration: "none" }}>Home</Link>
                    <Link href="/blog" style={{ color: "var(--text-secondary, #555)", textDecoration: "none", fontWeight: "bold" }}>Blog</Link>
                    <Link href="/about" style={{ color: "var(--text-secondary, #555)", textDecoration: "none" }}>About</Link>
                    <Link href="/notebook" style={{ color: "var(--text-secondary, #555)", textDecoration: "none" }}>Notebook</Link>
                    <Link href="/privacy-policy" style={{ color: "var(--text-secondary, #555)", textDecoration: "none" }}>Privacy</Link>
                </div>
            </nav>

            <div style={{ maxWidth: 640, margin: "0 auto", padding: "60px 24px 100px" }}>

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 48 }}>
                    <div style={{
                        display: "inline-block", padding: "4px 16px", borderRadius: 20,
                        background: "#D4A01715", border: "1px solid #D4A01740",
                        fontSize: 11, fontFamily: "sans-serif", fontWeight: 700,
                        letterSpacing: "0.3em", textTransform: "uppercase",
                        color: "#B8860B", marginBottom: 20,
                    }}>✦ Get in Touch</div>
                    <h1 style={{
                        fontFamily: "'Cinzel', serif", fontSize: "clamp(28px, 4vw, 42px)",
                        fontWeight: 900, marginBottom: 16,
                        color: "var(--text-primary, #1a1a1a)",
                    }}>Contact Us</h1>
                    <p style={{
                        fontSize: 16, lineHeight: 1.8, color: "var(--text-secondary, #666)",
                        fontStyle: "italic",
                    }}>
                        Have a question, feedback, or prayer request? We would love to hear from you.
                        We typically respond within 24–48 hours.
                    </p>
                </div>

                {/* Contact Info Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40 }}>
                    {[
                        { icon: "✉️", label: "Email", value: "support@dailymannaai.com" },
                        { icon: "🌐", label: "Website", value: "www.dailymannaai.com" },
                    ].map((item, i) => (
                        <div key={i} style={{
                            background: "var(--bg-secondary, #f9f9f7)",
                            border: "1px solid var(--border-secondary, #ebebeb)",
                            borderRadius: 12, padding: "18px 20px", textAlign: "center",
                        }}>
                            <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                            <div style={{ fontSize: 11, fontFamily: "sans-serif", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted, #999)", marginBottom: 4 }}>{item.label}</div>
                            <div style={{ fontSize: 13, color: "var(--text-secondary, #555)", fontFamily: "sans-serif" }}>{item.value}</div>
                        </div>
                    ))}
                </div>

                {/* Form */}
                {sent ? (
                    <div style={{
                        background: "#22c55e12", border: "1px solid #22c55e40",
                        borderRadius: 16, padding: "40px", textAlign: "center",
                    }}>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
                        <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: 20, marginBottom: 10, color: "var(--text-primary, #1a1a1a)" }}>
                            Message Sent — Blessings!
                        </h3>
                        <p style={{ color: "var(--text-secondary, #666)", fontStyle: "italic" }}>
                            Thank you for reaching out. We will get back to you shortly.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {[
                            { label: "Your Name", id: "name", type: "text", placeholder: "John Smith", key: "name" as const },
                            { label: "Email Address", id: "email", type: "email", placeholder: "john@example.com", key: "email" as const },
                        ].map((field) => (
                            <div key={field.id}>
                                <label style={{
                                    display: "block", fontFamily: "sans-serif", fontSize: 12,
                                    fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                                    color: "var(--text-muted, #888)", marginBottom: 8,
                                }}>{field.label}</label>
                                <input
                                    id={field.id}
                                    type={field.type}
                                    required
                                    placeholder={field.placeholder}
                                    value={form[field.key]}
                                    onChange={(e) => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                                    style={{
                                        width: "100%", padding: "13px 16px",
                                        background: "var(--bg-input, #f2f2f0)",
                                        border: "1px solid var(--border-primary, #e0e0e0)",
                                        borderRadius: 10, fontSize: 15,
                                        fontFamily: "Georgia, serif",
                                        color: "var(--text-primary, #1a1a1a)",
                                        outline: "none", boxSizing: "border-box",
                                        transition: "border-color 0.2s",
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = "#D4A017"}
                                    onBlur={(e) => e.target.style.borderColor = "var(--border-primary, #e0e0e0)"}
                                />
                            </div>
                        ))}
                        <div>
                            <label style={{
                                display: "block", fontFamily: "sans-serif", fontSize: 12,
                                fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                                color: "var(--text-muted, #888)", marginBottom: 8,
                            }}>Your Message</label>
                            <textarea
                                id="message"
                                required
                                rows={6}
                                placeholder="Write your message, question, or prayer request here..."
                                value={form.message}
                                onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                                style={{
                                    width: "100%", padding: "13px 16px",
                                    background: "var(--bg-input, #f2f2f0)",
                                    border: "1px solid var(--border-primary, #e0e0e0)",
                                    borderRadius: 10, fontSize: 15,
                                    fontFamily: "Georgia, serif",
                                    color: "var(--text-primary, #1a1a1a)",
                                    outline: "none", resize: "vertical", boxSizing: "border-box",
                                    transition: "border-color 0.2s",
                                }}
                                onFocus={(e) => e.target.style.borderColor = "#D4A017"}
                                onBlur={(e) => e.target.style.borderColor = "var(--border-primary, #e0e0e0)"}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={sending}
                            style={{
                                background: "#1a1a1a", color: "#fff",
                                border: "none", borderRadius: 10, padding: "14px 32px",
                                fontFamily: "sans-serif", fontWeight: 700,
                                fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase",
                                cursor: sending ? "not-allowed" : "pointer",
                                opacity: sending ? 0.6 : 1,
                                transition: "all 0.2s",
                                alignSelf: "flex-start",
                            }}
                        >
                            {sending ? "Sending..." : "Send Message ✦"}
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}
