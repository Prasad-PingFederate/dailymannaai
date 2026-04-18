// src/app/privacy-policy/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description:
        "DailyMannaAI Privacy Policy — Learn how we collect, use, and protect your personal information on our Christian AI search platform.",
    alternates: { canonical: "/privacy-policy" },
};

const LAST_UPDATED = "March 8, 2026";
const SITE = "DailyMannaAI";
const DOMAIN = "www.dailymannaai.com";
const EMAIL = "support@dailymannaai.com";

export default function PrivacyPolicyPage() {
    const sections = [
        {
            title: "1. Information We Collect",
            body: `We collect information you provide directly to us, such as when you use our search features, contact us, or interact with our AI assistant. This may include:

• Search queries you enter into our platform
• Email address if you contact us
• Usage data such as pages visited and features used
• Device and browser information (anonymized)
• Cookies and similar tracking technologies

We do NOT collect sensitive personal information such as financial data, passwords, or government IDs.`,
        },
        {
            title: "2. How We Use Your Information",
            body: `We use the information we collect to:

• Provide, maintain, and improve our services
• Power the AI search and devotional responses
• Analyze usage patterns to improve user experience
• Respond to your comments, questions, and requests
• Send periodic updates about new features (only if you opt in)
• Comply with legal obligations`,
        },
        {
            title: "3. Google AdSense & Advertising",
            body: `${SITE} uses Google AdSense to display advertisements. Google and its partners may use cookies to display ads based on your prior visits to this website or other sites on the Internet.

You may opt out of personalized advertising by visiting Google's Ads Settings at: https://www.google.com/settings/ads

Third-party vendors, including Google, use cookies to serve ads based on a user's prior visit to our website. For more information about how Google uses data, visit: https://policies.google.com/privacy`,
        },
        {
            title: "4. Cookies",
            body: `We use cookies and similar tracking technologies to track activity on our platform and improve your experience. Cookies are small files stored on your device.

You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, some features of our platform may not function properly without cookies.

Types of cookies we use:
• Session Cookies — to operate our service
• Preference Cookies — to remember your settings (like dark/light mode)
• Analytics Cookies — to understand how our service is used`,
        },
        {
            title: "5. Data Sharing",
            body: `We do not sell, trade, or rent your personal information to third parties. We may share anonymized, aggregated data with:

• Analytics providers (e.g., Google Analytics) to help understand usage
• Cloud service providers that host our platform (e.g., Vercel)
• Law enforcement if required by law

All third-party service providers are obligated to keep your information confidential.`,
        },
        {
            title: "6. Data Retention",
            body: `We retain personal data only as long as necessary to provide our services and comply with legal obligations. Search queries processed by our AI are not stored permanently. Contact form submissions may be retained for up to 12 months for support purposes.`,
        },
        {
            title: "7. Children's Privacy",
            body: `${SITE} is designed for general audiences and does not knowingly collect personal information from children under 13 years of age. If you believe a child under 13 has provided us with personal information, please contact us at ${EMAIL} and we will promptly delete that information.`,
        },
        {
            title: "8. Your Rights",
            body: `Depending on your location, you may have the right to:

• Access the personal information we hold about you
• Request correction of inaccurate data
• Request deletion of your data
• Object to or restrict processing of your data
• Data portability

To exercise any of these rights, please contact us at ${EMAIL}.`,
        },
        {
            title: "9. Security",
            body: `We implement industry-standard security measures to protect your information, including HTTPS encryption, secure cloud infrastructure, and regular security reviews. However, no method of transmission over the Internet is 100% secure.`,
        },
        {
            title: "10. Third-Party Links",
            body: `Our platform may contain links to third-party websites (such as news articles, sermon providers, or Bible resources). We are not responsible for the privacy practices of those sites. We encourage you to review the privacy policy of every site you visit.`,
        },
        {
            title: "11. Changes to This Policy",
            body: `We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the date at the top of this page. Your continued use of ${SITE} after changes constitutes your acceptance of the updated policy.`,
        },
        {
            title: "12. Contact Us",
            body: `If you have any questions about this Privacy Policy, please contact us:\n\nEmail: ${EMAIL}\nWebsite: https://${DOMAIN}\nContact Page: https://${DOMAIN}/contact`,
        },
    ];

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
                    <Link href="/about" style={{ color: "var(--text-secondary, #555)", textDecoration: "none" }}>About</Link>
                    <Link href="/contact" style={{ color: "var(--text-secondary, #555)", textDecoration: "none" }}>Contact</Link>
                </div>
            </nav>

            <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px 100px" }}>

                {/* Header */}
                <div style={{ marginBottom: 48 }}>
                    <div style={{
                        display: "inline-block", padding: "4px 16px", borderRadius: 20,
                        background: "#D4A01715", border: "1px solid #D4A01740",
                        fontSize: 11, fontFamily: "sans-serif", fontWeight: 700,
                        letterSpacing: "0.3em", textTransform: "uppercase",
                        color: "#B8860B", marginBottom: 20,
                    }}>✦ Legal</div>
                    <h1 style={{
                        fontFamily: "'Cinzel', serif", fontSize: "clamp(28px, 4vw, 44px)",
                        fontWeight: 900, marginBottom: 12,
                        color: "var(--text-primary, #1a1a1a)",
                    }}>Privacy Policy</h1>
                    <p style={{ fontSize: 14, color: "var(--text-muted, #888)", fontFamily: "sans-serif" }}>
                        Last updated: {LAST_UPDATED} &nbsp;|&nbsp; Effective: {LAST_UPDATED}
                    </p>
                    <p style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text-secondary, #555)", fontStyle: "italic", marginTop: 16 }}>
                        At {SITE} ({DOMAIN}), we are committed to protecting your privacy.
                        This Privacy Policy explains how we collect, use, and safeguard your
                        information when you use our platform.
                    </p>
                </div>

                {/* Sections */}
                <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
                    {sections.map((sec, i) => (
                        <section key={i}>
                            <h2 style={{
                                fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 700,
                                borderLeft: "4px solid #D4A017", paddingLeft: 14, marginBottom: 14,
                                color: "var(--text-primary, #1a1a1a)",
                            }}>{sec.title}</h2>
                            <div style={{ fontSize: 15, lineHeight: 1.9, color: "var(--text-secondary, #555)", whiteSpace: "pre-wrap" }}>
                                {sec.body}
                            </div>
                        </section>
                    ))}
                </div>

                {/* Footer note */}
                <div style={{
                    marginTop: 60, padding: "24px", borderRadius: 12,
                    background: "var(--bg-secondary, #f9f9f7)",
                    border: "1px solid var(--border-secondary, #ebebeb)",
                    textAlign: "center",
                }}>
                    <p style={{ fontSize: 14, color: "var(--text-muted, #888)", fontStyle: "italic", margin: 0 }}>
                        By using {SITE}, you agree to this Privacy Policy. For questions, email us at{" "}
                        <a href={`mailto:${EMAIL}`} style={{ color: "#B8860B" }}>{EMAIL}</a>
                    </p>
                </div>
            </div>
        </main>
    );
}
