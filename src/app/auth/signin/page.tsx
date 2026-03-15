"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "signin" | "signup";
type FieldError = { name?: string; email?: string; password?: string };

function AuthForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    const [mode, setMode] = useState<Mode>("signin");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldError>({});
    const [successMsg, setSuccessMsg] = useState("");

    const isSignup = mode === "signup";

    function validate(): boolean {
        const errs: FieldError = {};
        if (isSignup && !name.trim()) errs.name = "Name is required";
        if (!email.trim()) errs.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email";
        if (!password) errs.password = "Password is required";
        else if (isSignup && password.length < 8) errs.password = "Minimum 8 characters";
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setServerError(""); setSuccessMsg("");
        if (!validate()) return;
        setLoading(true);

        const endpoint = isSignup ? "/api/auth/register" : "/api/auth/login";
        const body = isSignup ? { name, email, password } : { email, password };

        try {
            const res = await fetch(endpoint, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (!res.ok) {
                setServerError(data.error || "Something went wrong.");
            } else {
                setSuccessMsg(isSignup
                    ? `Welcome, ${data.name}! Redirecting to Image Studio...`
                    : `Welcome back, ${data.name}! Redirecting...`
                );
                setTimeout(() => router.push(callbackUrl), 900);
            }
        } catch {
            setServerError("Network error. Please check your connection.");
        }
        setLoading(false);
    }

    function switchMode(m: Mode) {
        setMode(m); setServerError(""); setFieldErrors({}); setSuccessMsg("");
    }

    function passwordStrength(p: string): { label: string; color: string; width: string } {
        if (p.length === 0) return { label: "", color: "transparent", width: "0%" };
        if (p.length < 6) return { label: "Weak", color: "#e53e3e", width: "25%" };
        if (p.length < 8) return { label: "Fair", color: "#dd6b20", width: "50%" };
        if (p.length < 12) return { label: "Good", color: "#D4A017", width: "75%" };
        return { label: "Strong", color: "#2E7D52", width: "100%" };
    }

    const strength = isSignup ? passwordStrength(password) : null;

    const inputStyle = (hasError: boolean): React.CSSProperties => ({
        width: "100%", boxSizing: "border-box",
        background: "var(--bg-input, #f5f5f3)",
        border: `1px solid ${hasError ? "#e53e3e" : "var(--border-primary,#e8e8e8)"}`,
        borderRadius: "12px", padding: "13px 16px",
        fontSize: "15px", fontFamily: "Georgia, serif",
        color: "var(--text-primary,#1a1a1a)", outline: "none",
        transition: "border-color 0.2s",
    });

    return (
        <div style={{ minHeight: "100vh", display: "flex", fontFamily: "Georgia, serif", background: "var(--bg-secondary, #f9f9f7)" }}>

            {/* Left Dark Brand Panel */}
            <div style={{
                flex: "0 0 44%",
                background: "linear-gradient(to bottom, rgba(8, 8, 16, 0.7), rgba(15, 17, 24, 0.9)), url('/og-image.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                padding: "44px 48px 36px", position: "relative", overflow: "hidden",
            }}>
                <div style={{
                    position: "absolute", top: "35%", left: "50%",
                    transform: "translate(-50%,-50%)",
                    width: 420, height: 420, borderRadius: "50%",
                    background: "radial-gradient(circle, #D4A01715 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />

                <a href="/" style={{ textDecoration: "none" }}>
                    <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "0.06em" }}>
                        <span style={{ color: "white" }}>DAILY</span>
                        <span style={{ color: "#D4A017" }}>MANNA</span>
                        <span style={{ color: "white" }}>AI</span>
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.28)", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "sans-serif", marginTop: "3px" }}>
                        Holy Spirit-Guided Search
                    </div>
                </a>

                <div>
                    <div style={{
                        display: "inline-block",
                        background: "#D4A01720", border: "1px solid #D4A01740",
                        borderRadius: "24px", padding: "4px 14px",
                        fontSize: "10px", letterSpacing: "0.18em",
                        color: "#D4A017", textTransform: "uppercase",
                        fontFamily: "sans-serif", marginBottom: "18px",
                    }}>✦ Image Studio Access</div>

                    <h2 style={{
                        fontSize: "clamp(22px, 2.8vw, 36px)", fontWeight: 700,
                        color: "white", lineHeight: 1.2, margin: "0 0 14px", fontStyle: "italic",
                    }}>
                        Create Scripture-<br />Inspired Art
                    </h2>

                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", lineHeight: 1.8, fontStyle: "italic", marginBottom: "28px" }}>
                        Generate beautiful images from Bible verses, devotionals, and prophetic words to share with the world.
                    </p>

                    {[
                        ["🖼️", "AI image generation from Bible verses"],
                        ["📲", "Instant WhatsApp & social sharing"],
                        ["✨", "Multiple artistic styles"],
                        ["🔒", "Your creations saved securely"],
                        ["💛", "Free plan available — no credit card"],
                    ].map(([icon, text], i) => (
                        <div key={i} style={{
                            display: "flex", alignItems: "center", gap: "10px",
                            fontSize: "13px", color: "rgba(255,255,255,0.45)",
                            marginBottom: "9px", fontStyle: "italic",
                        }}>
                            <span style={{ fontSize: "15px", flexShrink: 0 }}>{icon}</span>
                            {text}
                        </div>
                    ))}

                    <div style={{ marginTop: "32px", borderLeft: "3px solid #D4A017", paddingLeft: "16px" }}>
                        <p style={{ fontSize: "12px", fontStyle: "italic", color: "rgba(255,255,255,0.35)", lineHeight: 1.7, margin: "0 0 6px" }}>
                            &ldquo;Write the vision, and make it plain upon tables, that he may run that readeth it.&rdquo;
                        </p>
                        <span style={{ fontSize: "11px", color: "#D4A017", fontFamily: "sans-serif", letterSpacing: "0.05em" }}>
                            &mdash; Habakkuk 2:2
                        </span>
                    </div>
                </div>

                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.18)", fontFamily: "sans-serif" }}>
                    © 2026 DailyMannaAI · Built with Prayer ✦
                </div>
            </div>

            {/* Right Form Panel */}
            <div style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                padding: "48px 24px", background: "var(--bg-primary, #ffffff)", overflowY: "auto",
            }}>
                <div style={{ width: "100%", maxWidth: "400px" }}>

                    {/* Tab toggle */}
                    <div style={{
                        display: "flex", background: "var(--bg-input, #f2f2f0)",
                        borderRadius: "14px", padding: "4px", marginBottom: "28px",
                    }}>
                        {(["signin", "signup"] as Mode[]).map((m) => (
                            <button key={m} onClick={() => switchMode(m)} style={{
                                flex: 1, padding: "10px", border: "none", borderRadius: "11px",
                                fontFamily: "Georgia, serif", fontSize: "14px", cursor: "pointer",
                                fontWeight: mode === m ? 700 : 400,
                                background: mode === m ? "var(--bg-card, #fff)" : "transparent",
                                color: mode === m ? "var(--text-primary, #1a1a1a)" : "var(--text-muted, #999)",
                                boxShadow: mode === m ? "0 1px 8px rgba(0,0,0,0.08)" : "none",
                                transition: "all 0.2s",
                            }}>
                                {m === "signin" ? "Sign In" : "Create Account"}
                            </button>
                        ))}
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                        <h1 style={{ fontSize: "clamp(20px, 2.5vw, 26px)", fontWeight: 700, fontStyle: "italic", margin: "0 0 6px", color: "var(--text-primary, #1a1a1a)" }}>
                            {isSignup ? "Join DailyMannaAI 🙏" : "Welcome back ✦"}
                        </h1>
                        <p style={{ fontSize: "13px", color: "var(--text-muted, #888)", margin: 0, fontStyle: "italic" }}>
                            {isSignup ? "Free account  No credit card needed" : "Sign in to access Image Studio"}
                        </p>
                    </div>

                    {serverError && (
                        <div style={{ background: "#fff5f5", border: "1px solid #ffc0c0", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", color: "#c00", marginBottom: "16px", fontFamily: "sans-serif" }}>
                            ⚠️ {serverError}
                        </div>
                    )}

                    {successMsg && (
                        <div style={{ background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", color: "#276749", marginBottom: "16px", fontFamily: "sans-serif" }}>
                            {successMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                        {isSignup && (
                            <div>
                                <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted,#888)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 600, marginBottom: "6px" }}>Full Name</label>
                                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" style={inputStyle(!!fieldErrors.name)}
                                    onFocus={(e) => e.target.style.borderColor = "#D4A017"}
                                    onBlur={(e) => e.target.style.borderColor = fieldErrors.name ? "#e53e3e" : "var(--border-primary,#e8e8e8)"} />
                                {fieldErrors.name && <p style={{ fontSize: "12px", color: "#e53e3e", marginTop: "5px", fontFamily: "sans-serif" }}>⚠ {fieldErrors.name}</p>}
                            </div>
                        )}

                        <div>
                            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted,#888)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 600, marginBottom: "6px" }}>Email Address</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" style={inputStyle(!!fieldErrors.email)}
                                onFocus={(e) => e.target.style.borderColor = "#D4A017"}
                                onBlur={(e) => e.target.style.borderColor = fieldErrors.email ? "#e53e3e" : "var(--border-primary,#e8e8e8)"} />
                            {fieldErrors.email && <p style={{ fontSize: "12px", color: "#e53e3e", marginTop: "5px", fontFamily: "sans-serif" }}>⚠ {fieldErrors.email}</p>}
                        </div>

                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                <label style={{ fontSize: "11px", color: "var(--text-muted,#888)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 600 }}>Password</label>
                                <button type="button" onClick={() => setShowPass(!showPass)} style={{ background: "none", border: "none", color: "var(--text-muted,#aaa)", cursor: "pointer", fontSize: "12px", fontFamily: "sans-serif" }}>
                                    {showPass ? "Hide" : "Show"}
                                </button>
                            </div>
                            <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                                placeholder={isSignup ? "Minimum 8 characters" : "Your password"} style={inputStyle(!!fieldErrors.password)}
                                onFocus={(e) => e.target.style.borderColor = "#D4A017"}
                                onBlur={(e) => e.target.style.borderColor = fieldErrors.password ? "#e53e3e" : "var(--border-primary,#e8e8e8)"} />
                            {isSignup && password.length > 0 && strength && (
                                <div style={{ marginTop: "8px" }}>
                                    <div style={{ height: "3px", background: "var(--bg-input,#f0f0f0)", borderRadius: "2px", overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: strength.width, background: strength.color, transition: "all 0.3s", borderRadius: "2px" }} />
                                    </div>
                                    <div style={{ fontSize: "11px", color: strength.color, marginTop: "4px", fontFamily: "sans-serif", textAlign: "right" }}>{strength.label}</div>
                                </div>
                            )}
                            {fieldErrors.password && <p style={{ fontSize: "12px", color: "#e53e3e", marginTop: "5px", fontFamily: "sans-serif" }}>⚠ {fieldErrors.password}</p>}

                            {!isSignup && (
                                <div style={{ textAlign: "right", marginTop: "8px" }}>
                                    <a href="/auth/forgot-password" style={{ fontSize: "12px", color: "var(--text-muted,#888)", fontFamily: "sans-serif", textDecoration: "underline" }}>
                                        Forgot password?
                                    </a>
                                </div>
                            )}
                        </div>

                        <button type="submit" disabled={loading} style={{
                            width: "100%", background: loading ? "#999" : "#1a1a1a",
                            color: "white", border: "none", borderRadius: "12px",
                            padding: "14px", fontSize: "15px", fontWeight: 700,
                            letterSpacing: "0.04em", cursor: loading ? "not-allowed" : "pointer",
                            fontFamily: "sans-serif", transition: "all 0.2s",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px",
                        }}>
                            {loading ? "Please wait..." : (isSignup ? "Create Free Account ✦" : "Sign In ✦")}
                        </button>
                    </form>

                    {isSignup && (
                        <p style={{ fontSize: "11px", color: "var(--text-faint,#bbb)", textAlign: "center", marginTop: "14px", lineHeight: 1.6, fontFamily: "sans-serif" }}>
                            By signing up you agree to our <a href="/privacy-policy" style={{ color: "#B8860B", textDecoration: "none" }}>Privacy Policy</a>.
                        </p>
                    )}

                    <p style={{ textAlign: "center", marginTop: "22px", fontSize: "14px", color: "var(--text-muted,#888)", fontFamily: "sans-serif" }}>
                        {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                        <button onClick={() => switchMode(isSignup ? "signin" : "signup")}
                            style={{ background: "none", border: "none", color: "#B8860B", fontWeight: 700, cursor: "pointer", fontSize: "14px", fontFamily: "sans-serif" }}>
                            {isSignup ? "Sign In" : "Sign up free ✦"}
                        </button>
                    </p>

                    <div style={{ textAlign: "center", marginTop: "10px" }}>
                        <a href="/" style={{ fontSize: "12px", color: "var(--text-faint,#bbb)", fontFamily: "sans-serif", textDecoration: "none" }}>
                            Back to DailyMannaAI
                        </a>
                    </div>
                </div>
            </div>

            <style>{`@media (max-width: 640px) { div[style*="flex: 0 0 44%"] { display: none !important; } }`}</style>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: "100vh", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", color: "#888" }}>Loading...</div>}>
            <AuthForm />
        </Suspense>
    );
}
