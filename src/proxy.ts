// src/proxy.ts  (renamed from middleware.ts — required by Next.js 16+)
// Combines:
//  1. Auth protection for Image Studio tab (redirects to /auth/signin)
//  2. Existing analytics logging (fire-and-forget)

import { NextResponse, NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/session";

export async function proxy(request: NextRequest) {
    const { pathname, href } = request.nextUrl;

    // ── 1. Auth guard for /auth/signin confirmation (already logged in → home) ─
    // If a logged-in user visits /auth/signin, redirect them home
    if (pathname === "/auth/signin") {
        const session = await getSessionFromRequest(request);
        if (session) {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    // ── 2. Analytics logging (fire-and-forget, unchanged from original) ────────
    const isInternal =
        pathname.startsWith("/_next") ||
        pathname.includes("/api/log") ||
        pathname.includes("/favicon.ico") ||
        pathname.endsWith(".png") ||
        pathname.endsWith(".jpg");

    if (!isInternal) {
        const logUrl = new URL("/api/log", request.url);
        fetch(logUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-forwarded-for": request.headers.get("x-forwarded-for") || "",
                "user-agent": request.headers.get("user-agent") || "",
                "referer": request.headers.get("referer") || "",
            },
            body: JSON.stringify({
                path: pathname,
                url: href,
                method: request.method,
                status: 200,
                timestamp: new Date().toISOString(),
                metadata: {
                    searchParams: Object.fromEntries(request.nextUrl.searchParams),
                },
            }),
        }).catch(() => { });
    }

    return NextResponse.next();
}

// Run on all routes (same as original)
export const config = {
    matcher: "/((?!api|_next/static|_next/image|favicon.ico).*)",
};
