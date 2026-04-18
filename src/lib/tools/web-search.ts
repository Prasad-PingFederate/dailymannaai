import { search, searchImages, SafeSearchType } from 'duck-duck-scrape';

export interface SearchResult {
    title: string;
    url: string;
    description: string;
}

export interface ImageResult {
    title: string;
    image: string;
    url: string;
    source: string;
}

// Timeout wrapper for promises
function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(errorMsg)), ms)
        )
    ]);
}

export async function performWebSearch(query: string): Promise<SearchResult[]> {
    try {
        console.log(`[WebSearch] Searching for: ${query}`);

        // 5 second timeout - DuckDuckGo can be slow/blocked on Vercel
        const response = await withTimeout(
            search(query, { safeSearch: SafeSearchType.STRICT }),
            5000,
            'Web search timeout (5s) - DuckDuckGo may be rate-limited'
        );

        if (!response.results || response.results.length === 0) {
            console.log('[WebSearch] No results found');
            return [];
        }

        // Map results to our interface
        const formattedResults: SearchResult[] = response.results.slice(0, 5).map((result: any) => ({
            title: result.title,
            url: result.url,
            description: result.description || "No description available"
        }));

        console.log(`[WebSearch] Found ${formattedResults.length} results`);
        return formattedResults;

    } catch (error: any) {
        console.warn('[WebSearch] Search failed (continuing without web results):', error.message);
        return []; // Graceful degradation - don't crash the entire request
    }
}

export async function performImageSearch(query: string): Promise<ImageResult[]> {
    try {
        // Force Wikipedia/Wikimedia for high-quality, relevant portraits
        const specificQuery = `${query} portrait site:wikimedia.org OR site:wikipedia.org`;
        console.log(`[ImageSearch] Searching for: ${specificQuery}`);

        const response = await withTimeout(
            searchImages(specificQuery, { safeSearch: SafeSearchType.STRICT }),
            5000,
            'Image search timeout (5s)'
        );

        if (!response.results || response.results.length === 0) {
            console.log('[ImageSearch] No images found on wiki. Skipping fallback to maintain quality.');
            return [];
        }

        // Map wiki results
        const wikiResults: ImageResult[] = response.results.slice(0, 5).map((result: any) => ({
            title: result.title,
            image: result.image,
            url: result.url,
            source: result.source
        }));

        console.log(`[ImageSearch] Found ${wikiResults.length} high-quality wiki images`);
        return wikiResults;

    } catch (error: any) {
        console.warn('[ImageSearch] Image search failed:', error.message);
        return [];
    }
}

export function formatSearchResults(results: SearchResult[]): string {
    if (results.length === 0) return "";

    return results.map((r, i) =>
        `[WEB RESULT ${i + 1}]\nTitle: ${r.title}\nURL: ${r.url}\nSummary: ${r.description}`
    ).join("\n\n");
}
