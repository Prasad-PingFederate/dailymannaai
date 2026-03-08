// src/hooks/useAuth.ts
"use client";
import { useState, useEffect } from "react";

interface AuthUser {
    userId: string;
    email: string;
    name: string;
    plan: string;
}

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/auth/me")
            .then((r) => r.ok ? r.json() : null)
            .then((data) => { setUser(data?.user ?? null); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    async function logout() {
        await fetch("/api/auth/logout", { method: "POST" });
        setUser(null);
        window.location.href = "/";
    }

    return { user, loading, logout, isLoggedIn: !!user };
}
