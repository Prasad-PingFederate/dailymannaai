
import { AIProviderManager } from './src/lib/ai/providers';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function diagnose() {
    console.log("--- AI Provider Diagnostic ---");
    const manager = new AIProviderManager();
    const providers = manager.getActiveProviders();
    console.log(`Active providers: ${providers.join(', ')}`);

    if (providers.length === 0) {
        console.error("No providers active! Check your .env.local keys.");
        return;
    }

    for (const providerName of providers) {
        console.log(`\nTesting ${providerName}...`);
        try {
            // Access private providers array using type casting for diagnostics
            const provider = (manager as any).providers.find((p: any) => p.name === providerName);
            if (!provider) {
                console.error(`Provider ${providerName} not found in manager.`);
                continue;
            }

            const start = Date.now();
            const response = await provider.generateResponse("Say 'API Online'");
            const duration = Date.now() - start;
            console.log(`✅ ${providerName} success (${duration}ms): "${response.trim()}"`);
        } catch (error: any) {
            console.error(`❌ ${providerName} failed: ${error.message}`);
            if (error.stack) {
                // console.error(error.stack);
            }
        }
    }
}

diagnose();
