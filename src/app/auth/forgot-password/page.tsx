"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "email" | "otp" | "password" | "success";

export default function ForgotPasswordPage() {
    const router = useRouter();

    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fieldError, setFieldError] = useState("");

    async function handleSendOTP(e: React.FormEvent) {
        e.preventDefault();
        setError(""); setFieldError("");
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setFieldError("Enter a valid email address.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Something went wrong.");
            } else {
                setStep("otp");
            }
        } catch {
            setError("Network error. Please try again.");
        }
        setLoading(false);
    }

    async function handleVerifyOTP(e: React.FormEvent) {
        e.preventDefault();
        setError(""); setFieldError("");
        if (!otp.trim() || otp.length !== 6) {
            setFieldError("Enter a valid 6-digit code.");
            return;
        }
        // Just go to next step, verification happens at final reset
        setStep("password");
    }

    async function handleResetPassword(e: React.FormEvent) {
        e.preventDefault();
        setError(""); setFieldError("");
        if (!password || password.length < 8) {
            setFieldError("Password must be at least 8 characters.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp, newPassword: password }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Something went wrong.");
                if (data.error?.includes("expired") || data.error?.includes("Incorrect")) {
                    setStep("otp"); // sending user back to try again
                }
            } else {
                setStep("success");
                setTimeout(() => router.push("/auth/signin"), 3000);
            }
        } catch {
            setError("Network error. Please try again.");
        }
        setLoading(false);
    }

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
                </a>

                <div>
                    <div style={{
                        display: "inline-block",
                        background: "#D4A01720", border: "1px solid #D4A01740",
                        borderRadius: "24px", padding: "4px 14px",
                        fontSize: "10px", letterSpacing: "0.18em",
                        color: "#D4A017", textTransform: "uppercase",
                        fontFamily: "sans-serif", marginBottom: "18px",
                    }}>✦ Account Recovery</div>

                    <h2 style={{
                        fontSize: "clamp(22px, 2.8vw, 36px)", fontWeight: 700,
                        color: "white", lineHeight: 1.2, margin: "0 0 14px", fontStyle: "italic",
                    }}>
                        Reset Your<br />Password
                    </h2>

                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", lineHeight: 1.8, fontStyle: "italic", marginBottom: "28px" }}>
                        Don't worry, it happens to everybody. Follow the steps to recover your DailyMannaAI account safely.
                    </p>
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

                    <div style={{ marginBottom: "24px" }}>
                        <h1 style={{ fontSize: "clamp(20px, 2.5vw, 26px)", fontWeight: 700, fontStyle: "italic", margin: "0 0 6px", color: "var(--text-primary, #1a1a1a)" }}>
                            Forgot Password?
                        </h1>
                        <p style={{ fontSize: "13px", color: "var(--text-muted, #888)", margin: 0, fontStyle: "italic" }}>
                            {step === "email" && "Enter your email to receive a recovery code."}
                            {step === "otp" && `We sent a 6-digit code to ${email}`}
                            {step === "password" && "Enter a new secure password."}
                            {step === "success" && "Password reset successful!"}
                        </p>
                    </div>

                    {error && (
                        <div style={{ background: "#fff5f5", border: "1px solid #ffc0c0", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", color: "#c00", marginBottom: "16px", fontFamily: "sans-serif" }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {/* STEP 1: Email */}
                    {step === "email" && (
                        <form onSubmit={handleSendOTP} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted,#888)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 600, marginBottom: "6px" }}>Email Address</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" style={inputStyle(!!fieldError)}
                                     
                                    onFocus={(e) => e.target.style.borderColor = "#D4A017"}
                                     
                                    onBlur={(e) => e.target.style.borderColor = fieldError ? "#e53e3e" : "var(--border-primary,#e8e8e8)"} />
                                {fieldError && <p style={{ fontSize: "12px", color: "#e53e3e", marginTop: "5px", fontFamily: "sans-serif" }}>⚠ {fieldError}</p>}
                            </div>

                            <button type="submit" disabled={loading} style={{
                                width: "100%", background: loading ? "#999" : "#1a1a1a",
                                color: "white", border: "none", borderRadius: "12px",
                                padding: "14px", fontSize: "15px", fontWeight: 700,
                                letterSpacing: "0.04em", cursor: loading ? "not-allowed" : "pointer",
                                fontFamily: "sans-serif", transition: "all 0.2s", marginTop: "4px",
                            }}>
                                {loading ? "Please wait..." : "Send Reset Code ✨"}
                            </button>
                        </form>
                    )}

                    {/* STEP 2: OTP */}
                    {step === "otp" && (
                        <form onSubmit={handleVerifyOTP} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted,#888)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 600, marginBottom: "6px" }}>6-Digit Verification Code</label>
                                <input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="123456"
                                    style={{ ...inputStyle(!!fieldError), letterSpacing: "0.3em", textAlign: "center", fontSize: "18px", fontWeight: "bold" }}
                                     
                                    onFocus={(e) => e.target.style.borderColor = "#D4A017"}
                                     
                                    onBlur={(e) => e.target.style.borderColor = fieldError ? "#e53e3e" : "var(--border-primary,#e8e8e8)"} />
                                {fieldError && <p style={{ fontSize: "12px", color: "#e53e3e", marginTop: "5px", fontFamily: "sans-serif", textAlign: "center" }}>⚠ {fieldError}</p>}
                            </div>

                            <button type="submit" style={{
                                width: "100%", background: "#1a1a1a",
                                color: "white", border: "none", borderRadius: "12px",
                                padding: "14px", fontSize: "15px", fontWeight: 700,
                                letterSpacing: "0.04em", cursor: "pointer",
                                fontFamily: "sans-serif", transition: "all 0.2s", marginTop: "4px",
                            }}>
                                Verify Code
                            </button>
                            <div style={{ textAlign: "center" }}>
                                <button type="button" onClick={() => setStep("email")} style={{ background: "none", border: "none", color: "var(--text-muted,#888)", cursor: "pointer", fontSize: "12px", fontFamily: "sans-serif", textDecoration: "underline" }}>
                                    Didn't get the code? Try again.
                                </button>
                            </div>
                        </form>
                    )}

                    {/* STEP 3: Password */}
                    {step === "password" && (
                        <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                    <label style={{ fontSize: "11px", color: "var(--text-muted,#888)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 600 }}>New Password</label>
                                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ background: "none", border: "none", color: "var(--text-muted,#aaa)", cursor: "pointer", fontSize: "12px", fontFamily: "sans-serif" }}>
                                        {showPass ? "Hide" : "Show"}
                                    </button>
                                </div>
                                <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter minimum 8 characters" style={inputStyle(!!fieldError)}
                                     
                                    onFocus={(e) => e.target.style.borderColor = "#D4A017"}
                                     
                                    onBlur={(e) => e.target.style.borderColor = fieldError ? "#e53e3e" : "var(--border-primary,#e8e8e8)"} />
                                {fieldError && <p style={{ fontSize: "12px", color: "#e53e3e", marginTop: "5px", fontFamily: "sans-serif" }}>⚠ {fieldError}</p>}
                            </div>

                            <button type="submit" disabled={loading} style={{
                                width: "100%", background: loading ? "#999" : "#1a1a1a",
                                color: "white", border: "none", borderRadius: "12px",
                                padding: "14px", fontSize: "15px", fontWeight: 700,
                                letterSpacing: "0.04em", cursor: loading ? "not-allowed" : "pointer",
                                fontFamily: "sans-serif", transition: "all 0.2s", marginTop: "4px",
                            }}>
                                {loading ? "Please wait..." : "Save New Password 🔒"}
                            </button>
                        </form>
                    )}

                    {/* SUCCESS */}
                    {step === "success" && (
                        <div style={{ textAlign: "center", padding: "20px" }}>
                            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
                            <h3 style={{ fontFamily: "sans-serif", margin: "0 0 10px", color: "#1a1a1a" }}>All Done!</h3>
                            <p style={{ fontSize: "14px", color: "#666", fontFamily: "sans-serif", lineHeight: 1.6 }}>
                                Your password has been successfully reset.<br />
                                You will be redirected to the sign-in page momentarily.
                            </p>
                        </div>
                    )}

                    {step !== "success" && (
                        <div style={{ textAlign: "center", marginTop: "24px" }}>
                            <a href="/auth/signin" style={{ fontSize: "13px", color: "var(--text-faint,#888)", fontFamily: "sans-serif", textDecoration: "none" }}>
                                Wait, I remember my password! <span style={{ color: "#B8860B", fontWeight: 600 }}>Sign In</span>
                            </a>
                        </div>
                    )}
                </div>
            </div>

            <style>{`@media (max-width: 640px) { div[style*="flex: 0 0 44%"] { display: none !important; } }`}</style>
        </div>
    );
}
