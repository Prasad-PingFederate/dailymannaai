import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { prompt, category } = await req.json();

        const HUGGINGFACE_TOKEN = process.env.huggingface_API;

        // Fallback Layer 1: Hugging Face (FLUX.1 Schnell)
        if (HUGGINGFACE_TOKEN) {
            try {
                console.log("Image API: Attempting HuggingFace...");
                const hfRes = await fetch("https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${HUGGINGFACE_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ inputs: prompt }),
                });

                if (hfRes.ok) {
                    const buffer = await hfRes.arrayBuffer();
                    const base64 = Buffer.from(buffer).toString('base64');
                    const contentType = hfRes.headers.get("content-type") || "image/jpeg";
                    return NextResponse.json({ url: `data:${contentType};base64,${base64}`, provider: "Hugging Face" });
                } else {
                    console.warn(`HuggingFace failed: ${hfRes.status} ${hfRes.statusText}`);
                }
            } catch (e) {
                console.warn("HuggingFace request errored", e);
            }
        }

        // Fallback Layer 2: Pollinations AI via Backend
        // Often Cloudflare blocks the user's browser, but the Vercel backend IP will succeed!
        try {
            console.log("Image API: Attempting Pollinations Backend...");
            const seed = Math.floor(Math.random() * 99999);
            const polliUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1080&nologo=true&seed=${seed}`;
            const pollRes = await fetch(polliUrl);

            if (pollRes.ok) {
                const buffer = await pollRes.arrayBuffer();
                const base64 = Buffer.from(buffer).toString('base64');
                const contentType = pollRes.headers.get("content-type") || "image/jpeg";
                return NextResponse.json({ url: `data:${contentType};base64,${base64}`, provider: "Pollinations" });
            } else {
                console.warn(`Pollinations failed: ${pollRes.status} ${pollRes.statusText}`);
            }
        } catch (e) {
            console.warn("Pollinations request errored", e);
        }

        // Fallback Layer 3: LoremFlickr Photo Route (100% Guaranteed Success)
        console.log("Image API: Providing Photo Fallback...");
        const seed = Math.floor(Math.random() * 999999);
        const searchTag = category ? encodeURIComponent(category.split(' ')[0].toLowerCase()) : "nature";
        const fallbackUrl = `https://loremflickr.com/1080/1080/nature,${searchTag}?lock=${seed}`;

        return NextResponse.json({ url: fallbackUrl, provider: "Photo API Fallback" });

    } catch (e: any) {
        console.error("Image generation API ultimate failure", e);
        return NextResponse.json({ error: "Failed to generate image entirely", details: e.message }, { status: 500 });
    }
}
