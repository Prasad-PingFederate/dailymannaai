import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
    const { pathname, search, href } = request.nextUrl;

    // Filter out internal Next.js requests, assets, and the log API itself
    const isInternal = pathname.startsWith('/_next') ||
        pathname.includes('/api/log') ||
        pathname.includes('/favicon.ico') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg');

    if (!isInternal) {
        // Fire-and-forget log call to our internal log API
        // We use fetch with a relative URL or absolute if needed
        const logUrl = new URL('/api/log', request.url);

        fetch(logUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
                'user-agent': request.headers.get('user-agent') || '',
                'referer': request.headers.get('referer') || ''
            },
            body: JSON.stringify({
                path: pathname,
                url: href,
                method: request.method,
                status: 200, // Middleware doesn't know the final status yet, so we log the intent
                timestamp: new Date().toISOString(),
                metadata: {
                    searchParams: Object.fromEntries(request.nextUrl.searchParams)
                }
            })
        }).catch(() => {
            // Silently ignore log failures in middleware to avoid breaking the site
        });
    }

    return NextResponse.next();
}

// Ensure it runs for all routes
export const config = {
    matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
