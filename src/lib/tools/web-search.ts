import { search, SafeSearchType } from 'duck-duck-scrape';

export interface SearchResult {
    title: string;
    url: string;
    description: string;
}

export async function performWebSearch(query: string): Promise<SearchResult[]> {
    try {
        console.log(`[WebSearch] Searching for: ${query}`);

        const response = await search(query, {
            safeSearch: SafeSearchType.STRICT
        });

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

        return formattedResults;

    } catch (error) {
        console.error('[WebSearch] Error performing search:', error);
        return [];
    }
}

export function formatSearchResults(results: SearchResult[]): string {
    if (results.length === 0) return "";

    return results.map((r, i) =>
        `[WEB RESULT ${i + 1}]\nTitle: ${r.title}\nURL: ${r.url}\nSummary: ${r.description}`
    ).join("\n\n");
}
