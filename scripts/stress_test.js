const { chromium } = require('playwright');
const path = require('path');

/**
 * DailyMannaAI "Chain-of-Memory" Stress Test v1.0
 * 
 * This script automates Test 1 from the Stress Test Framework:
 * It sends a specific fact and then bombards the AI with Bible questions 
 * to see how deep its memory (context window) really is.
 */

async function runStressTest() {
    console.log('🚀 Launching Automated Chat Stress Test...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // 1. Navigate to the App (Assuming local dev or Vercel preview)
        const baseUrl = process.env.TEST_TARGET_URL || 'https://dailymannaai.com';
        const targetUrl = baseUrl.endsWith('/') ? baseUrl + 'notebook' : baseUrl + '/notebook';
        console.log(`📡 Target: ${targetUrl}`);
        await page.goto(targetUrl);
        await page.waitForLoadState('networkidle');

        // 1.5 Handle "Initializing" screen or direct access
        console.log('🛸 Waiting for AntiGravity Core to initialize...');
        await page.waitForSelector('button:has-text("Chat"), textarea[placeholder*="Ask"]', { timeout: 30000 });

        // If "Chat" tab is not active, click it
        const chatTab = page.locator('button:has-text("Chat")');
        if (await chatTab.isVisible()) {
            console.log('👆 Clicking Chat Tab...');
            await chatTab.click();
        }
        await page.waitForSelector('textarea[placeholder*="Ask"]', { timeout: 10000 });

        // 2. Inject "Seed Secret"
        const secretVerse = "Habakkuk 3:19 is my favorite verse.";
        console.log(`📝 Phase 1: Injecting Secret fact: "${secretVerse}"`);
        await page.fill('textarea[placeholder*="Ask"]', secretVerse);
        await page.keyboard.press('Enter');
        await page.waitForResponse(res => res.url().includes('/api/chat') && res.status() === 200);
        // CRITICAL: Wait for the assistant bubble to actually render in the UI
        await page.waitForSelector('div:has-text("How can I assist") ~ div:has-text("assistant"), .assistant-message', { timeout: 15000 }).catch(() => console.log('⏳ Waiting for UI re-render...'));
        await page.waitForTimeout(2000); // Small buffer for React state settle
        console.log('✅ Secret Injected.');

        // 3. Bombard with Theological & Technical Questions (60 Questions)
        const distractions = [
            "Who was Polycarp?", "Athanasius vs Arius?", "Council of Nicaea results?", "Book of Hebrews author?", "Summary of Romans?",
            "What is the Trinity?", "Who was William Carey?", "The Great Commission definition?", "Charles Spurgeon's nickname?", "What is Justification?",
            "Who was Martin Luther?", "95 Theses summary?", "What is Sanctification?", "Who was D.L. Moody?", "What is Grace?",
            "Who was John Wesley?", "Methodism origins?", "What is the Atonement?", "Who was Billy Graham?", "Theology of the Cross?",
            "Who was Saint Augustine?", "City of God summary?", "What is Predestination?", "Who was Jacobus Arminius?", "Five Points of Calvinism?",
            "Who was Jim Elliot?", "Missionary to Ecuador?", "What is the Reformation?", "Who was Tyndale?", "Bible translation history?",
            "Who was Jonathan Edwards?", "Sinners in the Hands of an Angry God?", "What is the Great Awakening?", "Who was George Whitefield?", "Open-air preaching history?",
            "Who was Dietrich Bonhoeffer?", "The Cost of Discipleship?", "What is Christian Ethics?", "Who was C.S. Lewis?", "Mere Christianity summary?",
            "What is the Septuagint?", "Dead Sea Scrolls discovery?", "Who was Josephus?", "Historical Jesus proofs?", "What is Apologetics?",
            "Who was Blaise Pascal?", "Pascal's Wager explained?", "Relationship between Faith and Reason?", "What is the Cosmological Argument?", "The Teleological Argument?",
            "Who was Thomas Aquinas?", "Summa Theologica overview?", "What is Natural Law?", "Who was Francis of Assisi?", "History of Monasticism?",
            "Who was John Bunyan?", "Pilgrim's Progress summary?", "What is the Sovereignty of God?", "Who was Fanny Crosby?", "History of Hymns?",
            "What is the Biblical definition of Love?", "Summary of the Sermon on the Mount?"
        ];

        console.log(`🔥 Phase 2: Bombarding with ${distractions.length} distraction questions...`);
        for (let i = 0; i < distractions.length; i++) {
            const query = distractions[i];
            console.log(`   [${i + 1}/60] 👉 Prompt: ${query}`);
            await page.fill('textarea[placeholder*="Ask"]', query);
            await page.keyboard.press('Enter');

            // Wait for response and UI
            try {
                await page.waitForResponse(res => res.url().includes('/api/chat') && res.status() === 200, { timeout: 45000 });
                await page.waitForTimeout(1500); // Wait for stream to finish
            } catch (e) {
                console.warn(`      ⚠️ Slow response on question ${i + 1}`);
            }
        }

        // 4. The "Final Recall" Test
        const recallPrompt = "What was the very first favorite verse I mentioned?";
        console.log(`🎯 Phase 3: Testing Final Recall: "${recallPrompt}"`);
        await page.fill('textarea[placeholder*="Ask"]', recallPrompt);
        await page.keyboard.press('Enter');

        const response = await page.waitForResponse(res => res.url().includes('/api/chat') && res.status() === 200);
        const data = await response.json();

        console.log('\n' + '='.repeat(60));
        console.log('📊 STRESS TEST RESULT');
        console.log('='.repeat(60));
        console.log(`🤖 AI Answer: ${data.content.substring(0, 100)}...`);

        if (data.content.includes('Habakkuk 3:19')) {
            console.log('💎 RESULT: SUCCESS! Context Window is deep.');
        } else {
            console.log('📉 RESULT: FAILED. Context Window truncated.');
        }
        console.log('='.repeat(60) + '\n');

        await page.screenshot({ path: 'stress-test-result.png' });

    } catch (err) {
        console.error('❌ Stress Test Crashed:', err.message);
        await page.screenshot({ path: 'stress-test-error.png' });
    } finally {
        await browser.close();
    }
}

runStressTest();
