import { fetchYoutubeTranscript } from '@/lib/youtube-utils';

export async function POST(req) {
  const { url } = await req.json();
  try {
    const transcript = await fetchYoutubeTranscript(url);
    return Response.json({ transcript });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
