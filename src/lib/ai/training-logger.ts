import { getDatabase } from '../mongodb';

export interface TrainingData {
    timestamp: string;
    request: {
        query: string;
        provider: string;
        model: string;
        systemPrompt?: string;
        historyContextCount?: number;
    };
    response: {
        answer: string;
        latency: number;
        modelUsed: string;
    };
    metadata?: any;
}

export class TrainingLogger {
    private static COLLECTION_NAME = 'training_logs';

    static async log(data: TrainingData) {
        try {
            const db = await getDatabase();
            const collection = db.collection(this.COLLECTION_NAME);

            // Fire and forget (or await if you want strict consistency)
            await collection.insertOne({
                ...data,
                timestamp: data.timestamp || new Date().toISOString()
            });

            console.log(`[MongoDB] Training log saved successfully (${data.request.provider})`);
        } catch (error: any) {
            console.error(`[MongoDB] Training log failed:`, error.message);
            // We don't throw here to avoid crashing the main AI loop if logging fails
        }
    }
}
