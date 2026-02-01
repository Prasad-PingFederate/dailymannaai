// src/app/api/transcript/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchYoutubeTranscript } from '@/lib/youtube-utils'; // Adjust path if your utils file is elsewhere

export const dynamic = 'force-dynamic'; // Optional: ensure no caching if needed

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "url" in request body' },
        { status: 400 }
      );
    }

    console.log(`[API/transcript] Received request for URL: ${url}`);

    const transcript = await fetchYoutubeTranscript(url);

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'No transcript available for this video' },
        { status: 200 } // or 404 — your choice
      );
    }

    return NextResponse.json({
      success: true,
      transcript,
      length: transcript.length,
      // Optional: add metadata if you extract it later
      // videoId: extractedId,
    });

  } catch (error: any) {
    console.error('[API/transcript] Error:', error);

    const message = error.message || 'Failed to fetch transcript';
    const status = message.includes('Invalid') || message.includes('Missing') ? 400 : 500;

    return NextResponse.json(
      {
        error: message,
        // Optional: in dev you can expose more info
        // details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status }
    );
  }
}

// Optional: Add GET for testing in browser (returns usage info)
export async function GET() {
  return NextResponse.json({
    message: 'Use POST to /api/transcript with JSON body: { "url": "https://youtube.com/watch?v=..." }',
    example: {
      url: 'https://www.youtube.com/watch?v=U0OWCYIwjpM',
    },
  });
}
