const { generateGroundedResponse } = require('../src/lib/ai/gemini');
const { PrismaClient } = require('@prisma/client');
const { MongoClient } = require('mongodb');

async function verify() {
    console.log('🚀 Starting Dual-Database Logging Verification...');

    const query = "Who was Charles Spurgeon?";
    console.log(`\n1. Simulating interaction: "${query}"`);

    try {
        // This will trigger both Supabase (Prisma) and MongoDB logging
        await generateGroundedResponse(query, ["Charles Spurgeon was a Baptist preacher."], "Spurgeon web results", []);
        console.log('✅ AI Synthesis complete.');

        // Wait a moment for fire-and-forget logging to settle
        console.log('⏳ Waiting for logs to persist...');
        await new Promise(r => setTimeout(r, 3000));

        // 2. Check Supabase
        console.log('\n2. Verifying Supabase (Prisma)...');
        const prisma = new PrismaClient();
        const interaction = await prisma.interaction.findFirst({
            where: { query: { contains: "Spurgeon" } },
            orderBy: { createdAt: 'desc' }
        });

        if (interaction) {
            console.log('✅ Supabase Log Found:', {
                id: interaction.id,
                subject: interaction.subject,
                provider: interaction.provider
            });
        } else {
            console.log('❌ Supabase Log NOT Found.');
        }
        await prisma.$disconnect();

        // 3. Check MongoDB
        console.log('\n3. Verifying MongoDB (Training Data)...');
        const mongoUri = process.env.MONGODB_URI;
        if (mongoUri) {
            const client = new MongoClient(mongoUri);
            await client.connect();
            const db = client.db(process.env.MONGODB_DB);
            const logs = await db.collection('training_logs').find({
                "request.query": { $regex: "Spurgeon|DISCIPLE" }
            }).sort({ timestamp: -1 }).limit(2).toArray();

            if (logs.length > 0) {
                console.log(`✅ MongoDB Training Logs Found: ${logs.length}`);
                logs.forEach(log => {
                    console.log(`   - [${log.request.provider}] ${log.request.query.substring(0, 50)}...`);
                });
            } else {
                console.log('❌ MongoDB Training Logs NOT Found.');
            }
            await client.close();
        }

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    }
}

verify();
