/**
 * DailyMannaAI Advanced Reach Booster
 * 
 * Features:
 * 1. Trend Discovery: Multi-source scraping (Trends24 + Direct Twitter Explore).
 * 2. SimCluster Search: Finds high-engagement posts in the devotional cluster.
 * 3. Robust Automation: Uses Playwright with Cookie Persistence (PlayTune Synced).
 * 4. Algorithm Optimized: Posts 3-part threads with Like multipliers.
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

const LOCATIONS = [
    { name: 'India', path: 'india/' },
    { name: 'USA', path: 'united-states/' },
    { name: 'Global', path: '' }
];

/**
 * Strategy 1: External Trend Scraping (Trends24) - Very Stable
 */
async function getTrendsFromTrends24(locationPath = 'india/') {
    console.log(`🔍 Scoping trends from Trends24 (${locationPath || 'Global'})...`);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto(`https://trends24.in/${locationPath}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForSelector('.trend-card__list', { timeout: 10000 });
        const trends = await page.evaluate(() => {
            const listItems = document.querySelectorAll('.list-container:first-child .trend-link');
            return Array.from(listItems).map(item => item.textContent.trim());
        });
        console.log(`✅ Trends24: Found ${trends.length} topics.`);
        return trends;
    } catch (error) {
        console.error(`⚠️ Trends24 Error: ${error.message}`);
        return [];
    } finally {
        await browser.close();
    }
}

/**
 * Strategy 2: Direct Twitter Explore (Expertise from User)
 */
async function findTrendingHashtagsDirect() {
    console.log('📈 Scoping trends directly from Twitter Explore...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        // Note: Twitter often requires login for /explore, but sometimes it works for public view
        await page.goto('https://twitter.com/explore/tabs/trending', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForSelector('[data-testid="trend"]', { timeout: 10000 });
        const trends = await page.evaluate(() => {
            const elements = document.querySelectorAll('[data-testid="trend"]');
            return Array.from(elements).slice(0, 15).map(el => {
                const trendName = el.querySelector('[dir="ltr"]')?.textContent || '';
                return trendName.trim();
            }).filter(t => t);
        });
        console.log(`✅ Twitter Direct: Found ${trends.length} topics.`);
        return trends;
    } catch (error) {
        console.warn(`⚠️ Twitter Direct Trend lookup limited (Likely requires login).`);
        return [];
    } finally {
        await browser.close();
    }
}

/**
 * Search Strategy: Find high-performing posts for a query (Expertise from User)
 */
async function searchTwitterPosts(searchQuery, maxResults = 5) {
    console.log(`🔍 Searching Twitter for hot posts: "${searchQuery}"`);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    try {
        const searchUrl = `https://twitter.com/search?q=${encodeURIComponent(searchQuery)}&src=typed_query&f=live`;
        await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForSelector('article[data-testid="tweet"]', { timeout: 15000 });

        const tweets = await page.$$eval('article[data-testid="tweet"]', (articles, max) => {
            return articles.slice(0, max).map(article => {
                const tweetText = article.querySelector('[data-testid="tweetText"]')?.textContent || '';
                const linkElement = article.querySelector('a[href*="/status/"]');
                const url = linkElement ? 'https://twitter.com' + linkElement.getAttribute('href') : '';
                return { text: tweetText, url };
            });
        }, maxResults);

        console.log(`✅ Search: Found ${tweets.length} relevant posts.`);
        return tweets;
    } catch (error) {
        console.warn(`⚠️ Search failed: ${error.message}`);
        return [];
    } finally {
        await browser.close();
    }
}

function findClusterMatch(trends) {
    for (const trend of trends) {
        const lowerTrend = trend.toLowerCase();
        for (const keyword of DEVOTIONAL_KEYWORDS) {
            if (lowerTrend.includes(keyword.toLowerCase())) {
                return { trend, keyword };
            }
        }
    }
    return trends.length > 0 ? { trend: trends[0], keyword: 'General' } : null;
}

/**
 * Posting Logic (Synced with robust PlayTune Studio Pattern)
 */
async function postTweetViaPlaywright(threadItems) {
    console.log('Attempting to post via Playwright (PlayTune Logic Sync)...');

    if (!process.env.X_USERNAME || !process.env.X_PASSWORD) {
        throw new Error('X_USERNAME and X_PASSWORD secrets are required.');
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    let loginSuccess = false;

    try {
        // --- 1. Session Injection ---
        if (process.env.X_COOKIES) {
            console.log('Injecting session cookies...');
            try {
                const cookies = JSON.parse(process.env.X_COOKIES);
                await context.addCookies(cookies);
            } catch (e) {
                console.error('Invalid X_COOKIES format.');
            }
        }

        // Standard PlayTune Navigation
        await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(10000);

        const tweetButtonLocator = page.locator('[data-testid="SideNav_NewTweet_Button"], [data-testid="AppTabBar_Home_Link"]');
        if (await tweetButtonLocator.first().isVisible()) {
            console.log('Bypassed login via cookies!');
            loginSuccess = true;
        } else {
            console.log('Logging in manually...');
            await page.goto('https://x.com/i/flow/login', { waitUntil: 'domcontentloaded', timeout: 120000 });

            const usernameInput = page.locator('input[autocomplete="username"]');
            await usernameInput.waitFor({ timeout: 30000 });
            await usernameInput.fill(process.env.X_USERNAME);
            await page.keyboard.press('Enter');

            // Multi-stage PlayTune Login Handler
            for (let i = 0; i < 7; i++) {
                await page.waitForTimeout(5000);
                const currentUrl = page.url();
                const bodyText = await page.innerText('body').catch(() => '');
                console.log(`Login Step ${i + 1} | URL: ${currentUrl}`);

                // Password
                const passwordInput = page.locator('input[name="password"]');
                if (await passwordInput.isVisible()) {
                    await passwordInput.fill(process.env.X_PASSWORD);
                    await page.keyboard.press('Enter');
                    await page.waitForTimeout(5000);
                    continue;
                }

                // Verification
                if (bodyText.includes('verification') || bodyText.includes('identity') || bodyText.includes('suspicious') || bodyText.includes('phone or email')) {
                    if (process.env.X_EMAIL) {
                        const idInput = page.locator('input[name="text"], input[data-testid="challenge_response"], input[autocomplete="email"]');
                        if (await idInput.first().isVisible()) {
                            await idInput.first().fill(process.env.X_EMAIL);
                            await page.keyboard.press('Enter');
                            await page.waitForTimeout(5000);
                            continue;
                        }
                    }
                }

                if (await tweetButtonLocator.first().isVisible() || currentUrl.includes('/home')) {
                    console.log('Login successful!');
                    loginSuccess = true;
                    break;
                }
            }
        }

        if (!loginSuccess) {
            await page.waitForSelector('[data-testid="SideNav_NewTweet_Button"]', { timeout: 30000 }).catch(() => { });
            if (await tweetButtonLocator.first().isVisible()) loginSuccess = true;
        }

        if (!loginSuccess) throw new Error('Could not reach home screen.');

        // --- 2. Post Thread ---
        console.log('Opening composer...');
        await page.waitForSelector('[data-testid="SideNav_NewTweet_Button"]', { timeout: 15000 });
        await page.click('[data-testid="SideNav_NewTweet_Button"]');

        await page.waitForSelector('[data-testid="tweetTextarea_0"]', { timeout: 30000 });

        for (let i = 0; i < threadItems.length; i++) {
            const editor = page.locator(`[data-testid="tweetTextarea_${i}"]`).first();
            await editor.waitFor({ timeout: 10000 });
            await editor.focus();
            await editor.fill(threadItems[i]);

            if (i < threadItems.length - 1) {
                const addBtn = page.locator('[data-testid="add-tweet-button"]').first();
                if (await addBtn.isVisible()) {
                    await addBtn.click();
                    await page.waitForTimeout(2000);
                } else {
                    break;
                }
            }
        }

        console.log('Sending thread...');
        await page.click('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]', { force: true });

        await page.waitForTimeout(10000);
        const editorGone = !(await page.locator('[data-testid="tweetTextarea_0"]').first().isVisible());

        if (editorGone) {
            console.log('🎊 Thread successfully posted!');
            await page.screenshot({ path: 'reach-booster-success.png', fullPage: true });
        } else {
            console.log('Warning: Post verify failed. Capturing failure state.');
            await page.screenshot({ path: 'reach-booster-failure.png', fullPage: true });
        }

    } catch (error) {
        console.error('❌ Automation Error:', error);
        await page.screenshot({ path: 'reach-booster-failure.png', fullPage: true });
        throw error;
    } finally {
        await browser.close();
    }
}

async function main() {
    try {
        console.log('🚀 DailyMannaAI Advanced Reach Booster v3.0 (Research Integrated)...');

        // 1. Multi-Source Trend Discovery
        let trends = await findTrendingHashtagsDirect();
        if (trends.length === 0) {
            trends = await getTrendsFromTrends24('india/');
        }

        const match = findClusterMatch(trends);
        if (match) console.log(`✅ Matched Trend: ${match.trend} (${match.keyword})`);

        // 2. Deep Cluster Research (Finding high-value targets)
        const searchQuery = match ? match.trend : 'Daily Bible Verse';
        const hotPosts = await searchTwitterPosts(searchQuery, 3);
        if (hotPosts.length > 0) {
            console.log(`📈 Research Complete. Identified ${hotPosts.length} top posts for the "${searchQuery}" cluster.`);
        }

        // 3. Content Generation
        const threadItems = [
            `📖 Daily Manna: Trust in the Lord with all your heart.\n\nHis grace is sufficient for you today. ${match ? '#' + match.trend.replace(/\s/g, '').replace(/#/g, '') : '#Faith'} #DailyMannaAI #BibleVerse`,
            `💡 Meditation: Resting in His sovereignty brings peace that surpasses all understanding. ✨`,
            `🙏 Prayer: Lord, guide my steps and fill me with Your wisdom. (Tap ❤️ if you agree!)`
        ];

        if (process.env.DRY_RUN === 'true') {
            console.log('🧪 DRY_RUN active. No actual post.');
            threadItems.forEach((t, i) => console.log(`[Tweet ${i + 1}]: ${t}`));
            return;
        }

        // 4. Execution
        await postTweetViaPlaywright(threadItems);

        console.log('✅ Daily Automation Task Complete.');
    } catch (err) {
        console.error('❌ Fatal Script Error:', err);
        process.exit(1);
    }
}

main();
