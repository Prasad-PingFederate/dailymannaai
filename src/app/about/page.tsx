// src/app/about/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "About Us",
    description:
        "Learn about DailyMannaAI — the Holy Spirit-guided Christian search engine powered by AI. Discover our mission, vision, and the team behind the platform.",
    alternates: { canonical: "/about" },
};

export default function AboutPage() {
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
                    <Link href="/contact" style={{ color: "var(--text-secondary, #555)", textDecoration: "none" }}>Contact</Link>
                    <Link href="/privacy-policy" style={{ color: "var(--text-secondary, #555)", textDecoration: "none" }}>Privacy</Link>
                </div>
            </nav>

            <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px 100px" }}>

                {/* Hero */}
                <div style={{ textAlign: "center", marginBottom: 60 }}>
                    <div style={{
                        display: "inline-block", padding: "4px 16px", borderRadius: 20,
                        background: "#D4A01715", border: "1px solid #D4A01740",
                        fontSize: 11, fontFamily: "sans-serif", fontWeight: 700,
                        letterSpacing: "0.3em", textTransform: "uppercase",
                        color: "#B8860B", marginBottom: 20,
                    }}>✦ Our Story</div>
                    <h1 style={{
                        fontFamily: "'Cinzel', serif", fontSize: "clamp(32px, 5vw, 52px)",
                        fontWeight: 900, lineHeight: 1.1, marginBottom: 20,
                        color: "var(--text-primary, #1a1a1a)",
                    }}>
                        Built for the Faithful.<br />
                        <span style={{
                            background: "linear-gradient(135deg, #B8860B, #D4A017, #F5C842)",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                        }}>Guided by the Spirit.</span>
                    </h1>
                    <p style={{
                        fontSize: 18, lineHeight: 1.8, color: "var(--text-secondary, #555)",
                        fontStyle: "italic", maxWidth: 560, margin: "0 auto",
                    }}>
                        &ldquo;Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God.&rdquo;
                        <br /><span style={{ fontSize: 14 }}>— Matthew 4:4</span>
                    </p>
                </div>

                {/* Mission */}
                <section style={{ marginBottom: 48 }}>
                    <h2 style={{
                        fontFamily: "'Cinzel', serif", fontSize: 22, fontWeight: 700,
                        borderLeft: "4px solid #D4A017", paddingLeft: 16, marginBottom: 16,
                        color: "var(--text-primary, #1a1a1a)",
                    }}>Our Mission</h2>
                    <p style={{ fontSize: 16, lineHeight: 1.9, color: "var(--text-secondary, #555)" }}>
                        DailyMannaAI was born from a simple conviction: that every believer deserves instant,
                        accurate, Spirit-aligned answers to their questions about faith, scripture, and life.
                        We combine the power of modern Artificial Intelligence with thousands of years of
                        Biblical wisdom to create an experience unlike anything else on the internet.
                    </p>
                    <p style={{ fontSize: 16, lineHeight: 1.9, color: "var(--text-secondary, #555)", marginTop: 16 }}>
                        Whether you are searching for a specific Bible verse, seeking a morning devotional,
                        exploring a sermon, or asking a deep theological question — DailyMannaAI is here
                        to guide you with grace, accuracy, and love.
                    </p>
                </section>

                {/* What we offer */}
                <section style={{ marginBottom: 48 }}>
                    <h2 style={{
                        fontFamily: "'Cinzel', serif", fontSize: 22, fontWeight: 700,
                        borderLeft: "4px solid #D4A017", paddingLeft: 16, marginBottom: 24,
                        color: "var(--text-primary, #1a1a1a)",
                    }}>What We Offer</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
                        {[
                            { icon: "✦", title: "AI Bible Search", desc: "Find verses and context instantly using conversational AI." },
                            { icon: "📖", title: "Daily Devotionals", desc: "Curated devotionals to start your day with purpose and scripture." },
                            { icon: "🎙️", title: "Sermon Archive", desc: "Discover sermons from great preachers across Christian history." },
                            { icon: "🖼️", title: "Image Studio", desc: "Create beautiful Bible quote images to share on social media." },
                            { icon: "🔔", title: "Prophetic Alerts", desc: "Be notified of prophetic news and end-times events from a biblical lens." },
                            { icon: "📝", title: "AI Notebook", desc: "Journal, write, and study scripture with AI-powered assistance." },
                        ].map((item, i) => (
                            <div key={i} style={{
                                background: "var(--bg-card, #fff)",
                                border: "1px solid var(--border-secondary, #ebebeb)",
                                borderRadius: 14, padding: "22px 20px",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                            }}>
                                <div style={{ fontSize: 22, marginBottom: 10 }}>{item.icon}</div>
                                <h3 style={{
                                    fontFamily: "sans-serif", fontSize: 14, fontWeight: 700,
                                    marginBottom: 8, color: "var(--text-primary, #1a1a1a)",
                                }}>{item.title}</h3>
                                <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary, #666)", margin: 0 }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Values */}
                <section style={{ marginBottom: 48 }}>
                    <h2 style={{
                        fontFamily: "'Cinzel', serif", fontSize: 22, fontWeight: 700,
                        borderLeft: "4px solid #D4A017", paddingLeft: 16, marginBottom: 16,
                        color: "var(--text-primary, #1a1a1a)",
                    }}>Our Values</h2>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                        {[
                            "🕊️ Scripture First — Every answer is grounded in the Word of God.",
                            "🙏 Spirit-Led — We build with prayer and consecration.",
                            "🔓 Free for All — Core features will always be free.",
                            "🛡️ Safe & Trusted — No ads that compromise Christian values.",
                            "🌍 For Every Believer — Denominationally inclusive, Christ-centered.",
                        ].map((v, i) => (
                            <li key={i} style={{
                                display: "flex", alignItems: "flex-start", gap: 12,
                                fontSize: 15.5, lineHeight: 1.7, color: "var(--text-secondary, #444)",
                                fontStyle: "italic",
                            }}>{v}</li>
                        ))}
                    </ul>
                </section>

                {/* Contact CTA */}
                <div style={{
                    background: "linear-gradient(135deg, #B8860B0d, #D4A0170a)",
                    border: "1px solid #D4A01730",
                    borderRadius: 16, padding: "32px", textAlign: "center",
                }}>
                    <p style={{ fontSize: 17, fontStyle: "italic", color: "var(--text-secondary, #555)", marginBottom: 20 }}>
                        Have a question, suggestion, or prayer request?
                    </p>
                    <Link href="/contact" style={{
                        display: "inline-block",
                        background: "#1a1a1a", color: "#fff",
                        padding: "12px 32px", borderRadius: 10,
                        fontFamily: "sans-serif", fontWeight: 700,
                        fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase",
                        textDecoration: "none",
                    }}>
                        Contact Us ✦
                    </Link>
                </div>
            </div>
        </main>
    );
}
