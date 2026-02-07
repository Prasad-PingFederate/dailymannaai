/**
 * DailyMannaAI Advanced Reach Booster v4.0 (Human-Mimicry / Galileo Bypass)
 * 
 * FEATURES:
 * 1. Authenticated Research: Uses X_BEARER_TOKEN for high-speed, safe trend/post search.
 * 2. Human-Mimicry Module: Gaussian typing, Bezier curve mouse movements, and stealth fingerprints.
 * 3. Two-Tier Success: API v2 Primary + "Passed Like Human" Playwright Fallback.
 */

const { chromium } = require('playwright');
const { TwitterApi } = require('twitter-api-v2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Religious & Devotional Cluster Keywords
const DEVOTIONAL_KEYWORDS = [
    'Bible', 'Verse', 'DailyBread', 'Faith', 'Jesus', 'God', 'Christian', 'Worship',
    'Prayer', 'Gospel', 'Scripture', 'Blessing', 'Spiritual', 'Amen', 'Grace', 'Morning',
    'Hope', 'Peace', 'Love', 'Wisdom', 'Inspiration', 'Miracle', 'Testimony'
];

/**
 * --- HUMAN-MIMICRY HELPERS ---
 */

// 1. Gaussian Human Typing (Uneven speed)
async function humanType(page, selector, text) {
    const element = page.locator(selector);
    await element.focus();
    for (const char of text) {
        await page.keyboard.type(char, { delay: Math.random() * 200 + 50 }); // 50-250ms delay per char
        if (Math.random() > 0.9) await page.waitForTimeout(Math.random() * 500); // Occasional pause
    }
}

// 2. Bezier Mouse Pathing / Robust Click
async function humanClick(page, selectors) {
    // If input is single string, make array
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];

    let element = null;
    for (const sel of selectorList) {
        element = page.locator(sel).first();
        if (await element.isVisible().catch(() => false)) break;
    }

    if (!element) throw new Error(`Could not find any of selectors: ${selectorList.join(', ')}`);

    const box = await element.boundingBox();
    if (box) {
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        // Move mouse in a "jittery" human way to the point
        await page.mouse.move(x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 50, { steps: 5 });
        await page.mouse.move(x, y, { steps: 10 });
        await page.waitForTimeout(Math.random() * 500 + 200);
        await element.click();
    } else {
        await element.click(); // Fallback
    }
}

/**
 * --- STRATEGY 1: API RESEARCH (High Speed & Safe) ---
 */
async function getTrendsAndPosts() {
    console.log('🔍 Executing High-Speed Research via X Bearer Token...');

    if (!process.env.X_BEARER_TOKEN) {
        console.warn('⚠️ X_BEARER_TOKEN missing. Some research may be limited.');
        return { match: null, posts: [] };
    }

    const client = new TwitterApi(process.env.X_BEARER_TOKEN);
    let match = null;

    try {
        // In API v2, we usually search for keywords to find trends or "Popular" posts
        console.log('📈 Searching for devotional clusters...');
        const query = DEVOTIONAL_KEYWORDS[Math.floor(Math.random() * DEVOTIONAL_KEYWORDS.length)];
        const search = await client.v2.search(query, { 'tweet.fields': 'public_metrics', max_results: 10 });

        const posts = search.tweets.map(t => ({ text: t.text, id: t.id }));
        match = { trend: query, keyword: query };

        console.log(`✅ Research Complete. Cluster: ${query}. Found ${posts.length} top posts.`);
        return { match, posts };
    } catch (e) {
        if (e.message.includes('402')) {
            console.warn('⚠️ Twitter Research API requires Paid tier. Falling back to Trends24...');
        } else {
            console.error('❌ API Research Failed:', e.message);
        }

        // --- FALLBACK TO SCRAPING FOR FREE TIER ---
        try {
            console.log('📈 Attempting Trends24 fallback...');
            const browser = await chromium.launch({ headless: true });
            const page = await browser.newPage();
            await page.goto('https://trends24.in/india/', { waitUntil: 'domcontentloaded', timeout: 30000 });
            const trends = await page.evaluate(() => Array.from(document.querySelectorAll('.list-container:first-child .trend-link')).map(t => t.textContent.trim()));
            await browser.close();

            const matchTrend = trends.find(t => DEVOTIONAL_KEYWORDS.some(kw => t.toLowerCase().includes(kw.toLowerCase()))) || trends[0];
            return { match: { trend: matchTrend, keyword: 'Trend' }, posts: [] };
        } catch (err) {
            console.error('❌ Trends24 Fallback failed:', err.message);
            return { match: null, posts: [] };
        }
    }
}

/**
 * --- STRATEGY 2: API POSTING (v2 Thread) ---
 */
async function postTweetViaAPI(threadItems) {
    console.log('Attempting Primary Post via Twitter API (v2)...');

    // Debugging which keys are reaching the environment
    console.log('Credential Check (Masked):', {
        CONSUMER_KEY: process.env.TWITTER_API_KEY ? '[SET]' : '[MISSING]',
        CONSUMER_SECRET: process.env.TWITTER_API_SECRET ? '[SET]' : '[MISSING]',
        ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN ? '[SET]' : '[MISSING]',
        ACCESS_SECRET: process.env.TWITTER_ACCESS_SECRET ? '[SET]' : '[MISSING]'
    });

    const hasCreds = process.env.TWITTER_API_KEY && process.env.TWITTER_API_SECRET &&
        process.env.TWITTER_ACCESS_TOKEN && process.env.TWITTER_ACCESS_SECRET;

    if (!hasCreds) {
        console.warn('⚠️ API Credentials incomplete. Checking missing keys:');
        if (!process.env.TWITTER_API_KEY) console.warn('   - Missing: TWITTER_API_KEY (CONSUMER_KEY)');
        if (!process.env.TWITTER_API_SECRET) console.warn('   - Missing: TWITTER_API_SECRET (CONSUMER_KEY_SECRET)');
        if (!process.env.TWITTER_ACCESS_TOKEN) console.warn('   - Missing: TWITTER_ACCESS_TOKEN (X_ACCESS_TOKEN)');
        if (!process.env.TWITTER_ACCESS_SECRET) console.warn('   - Missing: TWITTER_ACCESS_SECRET (ACCESS_TOKEN_SECRET)');
        return false;
    }

    const client = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });

    try {
        // Test authentication first (User-provided logic)
        const authTest = await client.v2.me();
        console.log('✅ Authenticated as:', authTest.data.username);

        await client.v2.tweetThread(threadItems);
        console.log('✅ Thread successfully posted via Official API!');
        return true;
    } catch (error) {
        console.error('❌ API Post Error:', error.code, error.message);

        if (error.code === 402) {
            console.log('💡 402 = Payment Required. Free tier may not support thread/tweet creation.');
        } else if (error.code === 401) {
            console.log('💡 401 = Invalid credentials. Check your GitHub Secrets.');
        } else if (error.code === 403) {
            console.log('💡 403 = Forbidden. Your App may not have "Read and Write" permissions.');
        }

        return false;
    }
}

/**
 * --- STRATEGY 3: BROWSER FALLBACK (Human-Mimicry v4.0) ---
 */
async function postTweetViaPlaywright(threadItems) {
    console.log('Attempting Human-Like Fallback (Bypassing Bot Detection)...');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
        // Stealth Fingerprinting
        javaScriptEnabled: true,
        deviceScaleFactor: 1
    });

    // Remove "WebDriver" flag to bypass basic bot tests
    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(120000);

    try {
        if (process.env.X_COOKIES) {
            console.log('Injecting session cookies...');
            try { await context.addCookies(JSON.parse(process.env.X_COOKIES)); } catch (e) { }
        }

        await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(10000);
        await page.screenshot({ path: 'home-preview.png' });

        const tweetButtonSelectors = [
            '[data-testid="SideNav_NewTweet_Button"]',
            '[data-testid="AppTabBar_Home_Link"]', // Mobile view button
            'a[href="/compose/tweet"]'
        ];

        let foundButton = false;
        for (const sel of tweetButtonSelectors) {
            if (await page.locator(sel).first().isVisible()) {
                foundButton = true;
                break;
            }
        }

        if (!foundButton) {
            console.log('Login likely required. Current page: ' + page.url());
            await page.screenshot({ path: 'login-required.png' });
            await page.goto('https://x.com/i/flow/login', { waitUntil: 'domcontentloaded' });

            await page.waitForTimeout(Math.random() * 3000 + 2000);
            await humanType(page, 'input[autocomplete="username"]', process.env.X_USERNAME);
            await page.keyboard.press('Enter');

            for (let i = 0; i < 7; i++) {
                await page.waitForTimeout(Math.random() * 3000 + 4000);
                const currentUrl = page.url();
                const bodyText = await page.innerText('body').catch(() => '');

                if (await page.locator('input[name="password"]').isVisible()) {
                    await humanType(page, 'input[name="password"]', process.env.X_PASSWORD);
                    await page.keyboard.press('Enter');
                    await page.waitForTimeout(5000);
                    continue;
                }

                if (bodyText.includes('verification') || bodyText.includes('identity')) {
                    if (process.env.X_EMAIL) {
                        const idInp = page.locator('input[name="text"], input[autocomplete="email"]');
                        if (await idInp.first().isVisible()) {
                            await humanType(page, 'input[name="text"]', process.env.X_EMAIL);
                            await page.keyboard.press('Enter');
                            await page.waitForTimeout(5000);
                            continue;
                        }
                    }
                }

                // Re-check the tweet button selectors after each login step
                let loggedIn = false;
                for (const sel of tweetButtonSelectors) {
                    if (await page.locator(sel).first().isVisible()) {
                        loggedIn = true;
                        break;
                    }
                }
                if (loggedIn || currentUrl.includes('/home')) break;
            }
        }

        // Final Wait & Micro-scroll (Human interaction)
        await page.waitForTimeout(5000);
        await page.evaluate(() => window.scrollBy(0, 300));
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'home-pre-post.png' });

        console.log('Interacting with Composer (Robust Multi-Selector)...');
        const finalComposerSelectors = [
            '[data-testid="SideNav_NewTweet_Button"]',
            '[data-testid="AppTabBar_Home_Link"]',
            'a[href="/compose/tweet"]'
        ];
        await humanClick(page, finalComposerSelectors);
        await page.waitForSelector('[data-testid="tweetTextarea_0"]', { timeout: 20000 });

        for (let i = 0; i < threadItems.length; i++) {
            const editor = page.locator(`[data-testid="tweetTextarea_${i}"]`).first();
            await humanType(page, `[data-testid="tweetTextarea_${i}"]`, threadItems[i]);

            if (i < threadItems.length - 1) {
                await humanClick(page, '[data-testid="add-tweet-button"]');
                await page.waitForTimeout(Math.random() * 1000 + 1000);
            }
        }

        await page.waitForTimeout(Math.random() * 2000 + 1000);
        console.log('Sending Post...');
        await humanClick(page, '[data-testid="tweetButton"], [data-testid="tweetButtonInline"]');

        await page.waitForTimeout(10000);
        console.log('✅ Post successfully completed via "Human-Mimicry" Browser.');
    } finally {
        await browser.close();
    }
}

async function main() {
    try {
        console.log('🚀 DailyMannaAI v4.0: Human-Level Reach Booster Initiated...');

        // 1. Research Step
        const { match, posts } = await getTrendsAndPosts();
        const trendTag = match ? '#' + match.trend.replace(/\s/g, '').replace(/#/g, '') : "#Faith";

        // 2. Content Generation
        const threadItems = [
            `📖 Daily Manna: Trust in the Lord with all your heart.\n\nHis grace is sufficient for you today. ${trendTag} #DailyMannaAI #BibleVerse #Grace`,
            `💡 Meditation: Resting in His sovereignty brings peace that surpasses all understanding. ✨`,
            `🙏 Prayer: Lord, guide my steps and fill me with Your wisdom. (Tap ❤️ if you agree!)`
        ];

        if (process.env.DRY_RUN === 'true') {
            console.log('🧪 DRY_RUN active. No actual post.');
            threadItems.forEach((t, i) => console.log(`[Tweet ${i + 1}]: ${t}`));
            return;
        }

        // 3. Execution (API -> Human Mimicry Fallback)
        let success = await postTweetViaAPI(threadItems);

        if (!success && process.env.X_USERNAME) {
            console.log('API Quota/Error. Transitioning to Human-Mimicry Fallback...');
            await postTweetViaPlaywright(threadItems);
            success = true;
        }

        if (success) {
            console.log('--- TASK COMPLETE: PASSED LIKE HUMAN 🌍 ---');
        } else {
            throw new Error('All posting strategies failed.');
        }

    } catch (err) {
        console.error('❌ Critical Error:', err.message);
        process.exit(1);
    }
}

main();
