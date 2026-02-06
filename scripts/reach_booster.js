/**
 * DailyMannaAI Advanced Reach Booster v3.5
 * 
 * FEATURES:
 * 1. Trend Discovery: Direct Twitter Explore + Trends24 fallback.
 * 2. API Primary: Uses Twitter API v2 for 100% reliable posting.
 * 3. Browser Fallback: Synced Playwright logic for when API is unavailable.
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
 * Strategy 1: Twitter API v2 (Primary Posting Method)
 */
async function postTweetViaAPI(threadItems) {
    console.log('Attempting to post via Twitter API (v2 Thread)...');

    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_ACCESS_TOKEN) {
        console.warn('⚠️ Twitter API credentials missing. Skipping API method.');
        return false;
    }

    const client = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });

    try {
        await client.v2.tweetThread(threadItems);
        console.log('✅ Thread successfully posted via API!');
        return true;
    } catch (error) {
        console.error('❌ API Post Failed:', error.message);
        return false;
    }
}

/**
 * Strategy 2: Browser Automation (Robust Fallback)
 */
async function postTweetViaPlaywright(threadItems) {
    console.log('Attempting Browser Automation (PlayTune Logic Sync)...');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    // Global Timeouts
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(120000);

    try {
        if (process.env.X_COOKIES) {
            console.log('Injecting session cookies...');
            try { await context.addCookies(JSON.parse(process.env.X_COOKIES)); } catch (e) { }
        }

        await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(10000);

        const tweetButtonLocator = page.locator('[data-testid="SideNav_NewTweet_Button"], [data-testid="AppTabBar_Home_Link"]');

        if (!(await tweetButtonLocator.first().isVisible())) {
            console.log('Standard Login Required...');
            await page.goto('https://x.com/i/flow/login', { waitUntil: 'domcontentloaded' });

            const userInp = page.locator('input[autocomplete="username"]');
            await userInp.waitFor({ timeout: 60000 });
            await userInp.fill(process.env.X_USERNAME);
            await page.keyboard.press('Enter');

            for (let i = 0; i < 7; i++) {
                await page.waitForTimeout(5000);
                const currentUrl = page.url();
                const bodyText = await page.innerText('body').catch(() => '');
                console.log(`Login Step ${i + 1} | URL: ${currentUrl}`);

                if (await page.locator('input[name="password"]').isVisible()) {
                    await page.locator('input[name="password"]').fill(process.env.X_PASSWORD);
                    await page.keyboard.press('Enter');
                    await page.waitForTimeout(5000);
                    continue;
                }

                if (bodyText.includes('verification') || bodyText.includes('identity')) {
                    if (process.env.X_EMAIL) {
                        const idInp = page.locator('input[name="text"], input[autocomplete="email"]');
                        if (await idInp.first().isVisible()) {
                            await idInp.first().fill(process.env.X_EMAIL);
                            await page.keyboard.press('Enter');
                            await page.waitForTimeout(5000);
                            continue;
                        }
                    }
                }

                if (await tweetButtonLocator.first().isVisible() || currentUrl.includes('/home')) break;
            }
        }

        // Final Wait for home
        await page.waitForSelector('[data-testid="SideNav_NewTweet_Button"]', { timeout: 30000 }).catch(() => { });

        console.log('Opening composer...');
        await page.click('[data-testid="SideNav_NewTweet_Button"]');
        await page.waitForSelector('[data-testid="tweetTextarea_0"]', { timeout: 20000 });

        for (let i = 0; i < threadItems.length; i++) {
            const editor = page.locator(`[data-testid="tweetTextarea_${i}"]`).first();
            await editor.fill(threadItems[i]);
            if (i < threadItems.length - 1) {
                await page.click('[data-testid="add-tweet-button"]');
                await page.waitForTimeout(2000);
            }
        }

        await page.click('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]', { force: true });
        await page.waitForTimeout(10000);
        console.log('✅ Post finished via Browser.');
    } finally {
        await browser.close();
    }
}

async function main() {
    try {
        console.log('🚀 DailyMannaAI Reach Booster (API Support Integrated)...');

        // 1. Trend Discovery (Using single lightweight launch)
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        let trends = [];
        try {
            await page.goto('https://trends24.in/india/', { waitUntil: 'domcontentloaded', timeout: 30000 });
            trends = await page.evaluate(() => Array.from(document.querySelectorAll('.list-container:first-child .trend-link')).map(t => t.textContent.trim()));
        } catch (e) {
            console.warn('Trends lookup failed, using general keywords.');
        }
        await browser.close();

        let match = trends.find(t => DEVOTIONAL_KEYWORDS.some(kw => t.toLowerCase().includes(kw.toLowerCase())));
        const trendTag = match ? `#${match.replace(/\s/g, '').replace(/#/g, '')}` : "#Faith";

        // 2. Content Generation
        const threadItems = [
            `📖 Daily Manna: Trust in the Lord with all your heart.\n\nHis grace is sufficient for you today. ${trendTag} #DailyMannaAI #BibleVerse #Grace`,
            `💡 Meditation: Resting in His sovereignty brings peace that surpasses all understanding. ✨`,
            `🙏 Prayer: Lord, guide my steps and fill me with Your wisdom. (Tap ❤️ if you agree!)`
        ];

        if (process.env.DRY_RUN === 'true') {
            console.log('🧪 DRY_RUN active. No post.');
            threadItems.forEach((t, i) => console.log(`[${i + 1}]: ${t}`));
            return;
        }

        // 3. Post Execution (API First, Fallback to Playwright)
        let success = await postTweetViaAPI(threadItems);

        if (!success && process.env.X_USERNAME) {
            console.log('Using browser-based fallback...');
            await postTweetViaPlaywright(threadItems);
            success = true;
        }

        if (success) console.log('✅ Task Finished Correctly.');
        else throw new Error('All posting methods failed.');

    } catch (err) {
        console.error('❌ Fatal Script Error:', err.message);
        process.exit(1);
    }
}

main();
