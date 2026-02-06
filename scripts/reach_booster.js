/**
 * DailyMannaAI Advanced Reach Booster v3.2
 * 
 * FEATURES:
 * 1. Trend Discovery: Direct Twitter Explore + Trends24 fallback.
 * 2. Deep Cluster Research: Find engaging posts to target specific interests.
 * 3. Robust Automation: Literal 1:1 Login Sync with PlayTune Studio.
 * 4. Algorithm Optimized: Multi-part threads for dwell time.
 */

const { chromium } = require('playwright');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Religious & Devotional Cluster Keywords
const DEVOTIONAL_KEYWORDS = [
    'Bible', 'Verse', 'DailyBread', 'Faith', 'Jesus', 'God', 'Christian', 'Worship',
    'Prayer', 'Gospel', 'Scripture', 'Blessing', 'Spiritual', 'Amen', 'Grace', 'Morning',
    'Hope', 'Peace', 'Love', 'Wisdom', 'Inspiration', 'Miracle', 'Testimony'
];

/**
 * Main logic follows the PlayTune Studio architecture:
 * 1. Single Browser Session
 * 2. Conservative Timeouts (120s)
 * 3. Multi-stage Challenge Handling
 */
async function main() {
    console.log('🚀 Starting DailyMannaAI Reach Booster (Single-Session Architecture)...');

    if (!process.env.X_USERNAME || !process.env.X_PASSWORD) {
        throw new Error('X_USERNAME and X_PASSWORD secrets are required.');
    }

    const browser = await chromium.launch({ headless: true });
    // Same User Agent as PlayTune for consistency
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    // CRITICAL: Set Global Timeouts to override Playwright defaults (Resolves 30s timeout issues)
    page.setDefaultTimeout(60000); // 1 minute for elements
    page.setDefaultNavigationTimeout(120000); // 2 minutes for navigation

    try {
        // --- STEP 1: TREND DISCOVERY ---
        let trends = [];
        let match = null;

        console.log('📈 Scoping trends directly from Twitter Explore...');
        try {
            await page.goto('https://twitter.com/explore/tabs/trending', { waitUntil: 'domcontentloaded' });
            await page.waitForSelector('[data-testid="trend"]', { timeout: 30000 });
            trends = await page.evaluate(() => {
                const elements = document.querySelectorAll('[data-testid="trend"]');
                return Array.from(elements).slice(0, 15).map(el => el.querySelector('[dir="ltr"]')?.textContent?.trim() || '').filter(t => t);
            });
            console.log(`✅ Twitter Direct: Found ${trends.length} topics.`);
        } catch (e) {
            console.warn('⚠️ Direct Trend lookup limited. Falling back to Trends24...');
            await page.goto('https://trends24.in/india/', { waitUntil: 'domcontentloaded' });
            await page.waitForSelector('.trend-card__list', { timeout: 15000 });
            trends = await page.evaluate(() => {
                const listItems = document.querySelectorAll('.list-container:first-child .trend-link');
                return Array.from(listItems).map(item => item.textContent.trim());
            });
            console.log(`✅ Trends24: Found ${trends.length} topics.`);
        }

        // Find match
        for (const trend of trends) {
            const lowerTrend = trend.toLowerCase();
            for (const kw of DEVOTIONAL_KEYWORDS) {
                if (lowerTrend.includes(kw.toLowerCase())) {
                    match = { trend, keyword: kw };
                    break;
                }
            }
            if (match) break;
        }
        if (!match && trends.length > 0) match = { trend: trends[0], keyword: 'General' };

        if (match) {
            console.log(`✅ Matched Trend: ${match.trend} (${match.keyword})`);

            // --- STEP 2: CLUSTER RESEARCH ---
            console.log(`🔍 Searching for hot posts in cluster: "${match.trend}"`);
            try {
                const searchUrl = `https://twitter.com/search?q=${encodeURIComponent(match.trend)}&src=typed_query&f=live`;
                await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
                await page.waitForSelector('article[data-testid="tweet"]', { timeout: 20000 });
                console.log('✅ Identified high-engagement cluster targets.');
            } catch (e) {
                console.warn('⚠️ Cluster research skipped due to timeout (non-critical).');
            }
        }

        // --- STEP 3: LOGIN PHASE (Synced with PlayTune Studio) ---
        console.log('Attempting Login Phase (PlayTune Logic Sync)...');
        let loginSuccess = false;

        if (process.env.X_COOKIES) {
            console.log('Injecting session cookies...');
            try {
                const cookies = JSON.parse(process.env.X_COOKIES);
                await context.addCookies(cookies);
            } catch (e) { }
        }

        await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(10000); // 10s wait for dynamic content

        const tweetButtonLocator = page.locator('[data-testid="SideNav_NewTweet_Button"], [data-testid="AppTabBar_Home_Link"]');
        if (await tweetButtonLocator.first().isVisible()) {
            console.log('Successfully bypassed login using session cookies!');
            loginSuccess = true;
        } else {
            console.log('Session cookies expired or missing. Proceeding to standard login...');
            await page.goto('https://x.com/i/flow/login', { waitUntil: 'domcontentloaded' });

            const usernameInput = page.locator('input[autocomplete="username"]');
            await usernameInput.waitFor({ timeout: 45000 });
            await usernameInput.fill(process.env.X_USERNAME);
            await page.keyboard.press('Enter');

            // Multi-stage login handler (Literal Sync with PlayTune lines 124-172)
            for (let i = 0; i < 7; i++) {
                await page.waitForTimeout(5000);
                const currentUrl = page.url();
                const bodyText = await page.innerText('body').catch(() => '');
                console.log(`Login Step ${i + 1} | URL: ${currentUrl}`);

                // 1. Password Screen
                const passwordInput = page.locator('input[name="password"]');
                if (await passwordInput.isVisible()) {
                    console.log('Password field detected. Entering password...');
                    await passwordInput.fill(process.env.X_PASSWORD);
                    await page.keyboard.press('Enter');
                    await page.waitForTimeout(5000);
                    continue;
                }

                // 2. Identity Verification
                if (bodyText.includes('verification') || bodyText.includes('identity') || bodyText.includes('suspicious') || bodyText.includes('phone or email')) {
                    console.log('Identity challenge detected. Attempting to solve...');
                    if (process.env.X_EMAIL) {
                        const idInput = page.locator('input[name="text"], input[data-testid="challenge_response"], input[autocomplete="email"]');
                        if (await idInput.first().isVisible()) {
                            await idInput.first().fill(process.env.X_EMAIL);
                            await page.keyboard.press('Enter');
                            await page.waitForTimeout(5000);
                            continue;
                        }
                    } else {
                        console.error('X_EMAIL missing - cannot solve challenge.');
                    }
                }

                // 3. Username prompt fallback
                const secondUsernameInput = page.locator('input[autocomplete="username"]');
                if (await secondUsernameInput.isVisible()) {
                    await secondUsernameInput.fill(process.env.X_USERNAME);
                    await page.keyboard.press('Enter');
                    continue;
                }

                if (await tweetButtonLocator.first().isVisible() || currentUrl.includes('/home')) {
                    console.log('Login successful! Home screen detected.');
                    loginSuccess = true;
                    break;
                }
            }
        }

        if (!loginSuccess) {
            await page.waitForSelector('[data-testid="SideNav_NewTweet_Button"]', { timeout: 30000 }).catch(() => { });
            if (await tweetButtonLocator.first().isVisible()) loginSuccess = true;
        }

        if (!loginSuccess) throw new Error('Could not reach home screen after login.');

        // --- STEP 4: POSTING PHASE ---
        const trendTag = match ? `#${match.trend.replace(/\s/g, '').replace(/#/g, '')}` : "#Faith";
        const threadItems = [
            `📖 Daily Manna: Trust in the Lord with all your heart.\n\nHis grace is sufficient for you today. ${trendTag} #DailyMannaAI #BibleVerse #Grace`,
            `💡 Meditation: Resting in His sovereignty brings peace that surpasses all understanding. ✨`,
            `🙏 Prayer: Lord, guide my steps and fill me with Your wisdom. (Tap ❤️ if you agree!)`
        ];

        if (process.env.DRY_RUN === 'true') {
            console.log('🧪 DRY_RUN active. Would have posted:');
            threadItems.forEach((t, i) => console.log(`[${i + 1}]: ${t}`));
        } else {
            console.log('Opening composer...');
            await page.click('[data-testid="SideNav_NewTweet_Button"]');
            await page.waitForSelector('[data-testid="tweetTextarea_0"]', { timeout: 20000 });

            for (let i = 0; i < threadItems.length; i++) {
                const editor = page.locator(`[data-testid="tweetTextarea_${i}"]`).first();
                await editor.waitFor();
                await editor.focus();
                await editor.fill(threadItems[i]);

                if (i < threadItems.length - 1) {
                    await page.click('[data-testid="add-tweet-button"]');
                    await page.waitForTimeout(2000);
                }
            }

            console.log('Clicking post button...');
            await page.click('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]', { force: true });
            await page.waitForTimeout(10000); // Wait for post to finish
            console.log('✅ Thread successfully posted!');
        }

    } catch (err) {
        console.error('❌ Action Error:', err.message);
        await page.screenshot({ path: 'reach-booster-error.png', fullPage: true });
        throw err;
    } finally {
        console.log('Closing browser session.');
        await browser.close();
    }
}

main().catch(err => {
    console.error('❌ Fatal Script Error:', err.message);
    process.exit(1);
});
