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
    { name: 'Global', path: '' }
];

async function getTrends(locationPath = 'india/') {
    console.log(`Starting Trend Discovery for ${locationPath || 'Global'} via Playwright...`);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(`https://trends24.in/${locationPath}`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.trend-card__list', { timeout: 10000 });

        const trends = await page.evaluate(() => {
            const listItems = document.querySelectorAll('.list-container:first-child .trend-link');
            return Array.from(listItems).map(item => item.textContent.trim());
        });

        console.log(`Trends found:`, trends.length > 0 ? trends.slice(0, 5).join(', ') + '...' : 'None');
        return trends;
    } catch (error) {
        console.error(`Error fetching trends for ${locationPath}:`, error.message);
        return [];
    } finally {
        await browser.close();
    }
}

function findDevotionalTrend(trends) {
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

async function postTweetViaPlaywright(threadItems) {
    console.log('Attempting to post via Playwright (Browser Automation)...');

    if (!process.env.X_USERNAME || !process.env.X_PASSWORD) {
        throw new Error('X_USERNAME and X_PASSWORD environment variables are required.');
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    let loginSuccess = false;

    try {
        // --- 1. Session Persistence (Cookie Injection) ---
        if (process.env.X_COOKIES) {
            console.log('X_COOKIES detected. Attempting to inject session...');
            try {
                const cookies = JSON.parse(process.env.X_COOKIES);
                await context.addCookies(cookies);
                console.log('Session cookies injected successfully.');
            } catch (cookieError) {
                console.error('Failed to parse X_COOKIES. Ensure it is a valid JSON array.');
            }
        }

        // Relaxed navigation for slow CI environments
        await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 120000 });
        console.log('Page navigation to x.com/home initiated. Waiting for specific elements...');
        await page.waitForTimeout(10000); // 10s wait for dynamic content

        // Check if we are already logged in
        const tweetButtonLocator = page.locator('[data-testid="SideNav_NewTweet_Button"], [data-testid="AppTabBar_Home_Link"]');
        if (await tweetButtonLocator.first().isVisible()) {
            console.log('Successfully bypassed login using session cookies!');
            loginSuccess = true;
        } else {
            console.log('Session cookies expired or missing. Proceeding to standard login...');
            await page.goto('https://x.com/i/flow/login', { waitUntil: 'domcontentloaded', timeout: 120000 });

            // Wait for input (username)
            const usernameInput = page.locator('input[autocomplete="username"]');
            await usernameInput.waitFor({ timeout: 30000 });
            await usernameInput.fill(process.env.X_USERNAME);
            await page.keyboard.press('Enter');

            // Multi-stage login handler
            console.log('Username submitted. Entering multi-stage login handler...');

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

                // 2. Identity Verification (Email/Username/Phone)
                if (bodyText.includes('verification') || bodyText.includes('identity') || bodyText.includes('suspicious') || bodyText.includes('phone or email') || bodyText.includes('check your email') || bodyText.includes('confirm your email')) {
                    console.log('Identity challenge detected. Attempting to solve...');
                    if (process.env.X_EMAIL) {
                        const idInput = page.locator('input[name="text"], input[data-testid="challenge_response"], input[autocomplete="email"]');
                        if (await idInput.first().isVisible()) {
                            await idInput.first().fill(process.env.X_EMAIL);
                            await page.keyboard.press('Enter');
                            console.log('Submitted X_EMAIL for verification.');
                            await page.waitForTimeout(5000);
                            continue;
                        }
                    } else {
                        console.error('X_EMAIL missing - cannot solve challenge.');
                    }
                }

                // 3. Just another Username prompt
                const secondUsernameInput = page.locator('input[autocomplete="username"]');
                if (await secondUsernameInput.isVisible()) {
                    console.log('Username requested again. Filling...');
                    await secondUsernameInput.fill(process.env.X_USERNAME);
                    await page.keyboard.press('Enter');
                    continue;
                }

                // 4. Check for success
                if (await tweetButtonLocator.first().isVisible() || currentUrl.includes('/home')) {
                    console.log('Login successful! Home screen detected.');
                    loginSuccess = true;
                    break;
                }
            }

            if (!loginSuccess) {
                console.log('Waiting for Twitter Home feed (final check)...');
                await page.waitForSelector('[data-testid="SideNav_NewTweet_Button"]', { timeout: 30000 }).catch(() => {
                    console.log('Final wait for Tweet Button timed out.');
                });
            }
        }

        if (!loginSuccess && !(await tweetButtonLocator.first().isVisible())) {
            throw new Error('Login failed. Could not reach home screen.');
        }

        // --- 2. Post Tweet ---
        console.log('Moving to posting phase...');
        await page.waitForSelector('[data-testid="SideNav_NewTweet_Button"]', { timeout: 15000 });
        await page.click('[data-testid="SideNav_NewTweet_Button"]');

        console.log('Waiting for tweet editor box...');
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
                    console.warn('⚠️ Threading button (+) not found. Posting as single tweet.');
                    break;
                }
            }
        }

        // Final Post/Tweet button
        const postButtonSelectors = [
            '[data-testid="tweetButton"]',
            '[data-testid="tweetButtonInline"]',
            'button:has-text("Post")',
            'button:has-text("Tweet all")'
        ];

        let posted = false;
        for (const selector of postButtonSelectors) {
            const btn = page.locator(selector).first();
            if (await btn.isVisible()) {
                console.log(`Clicking final post button (${selector})...`);
                await btn.click({ force: true });
                posted = true;
                break;
            }
        }

        if (!posted) {
            console.log('Post buttons not interactive. Trying Control+Enter fallback...');
            await page.keyboard.press('Control+Enter');
            posted = true;
        }

        // Verification
        console.log('Post action triggered. Verifying send...');
        await page.waitForTimeout(10000);
        const isStillThere = await page.locator('[data-testid="tweetTextarea_0"]').first().isVisible();

        if (!isStillThere) {
            console.log('🎊 Tweet/Thread posted successfully!');
            await page.screenshot({ path: 'reach-booster-success.png', fullPage: true });
        } else {
            console.log('Warning: Editor box is still visible. Capturing screenshot.');
            await page.screenshot({ path: 'reach-booster-failure.png', fullPage: true });
        }

    } catch (error) {
        console.error('❌ Reach Booster Error:', error);
        await page.screenshot({ path: 'reach-booster-failure.png', fullPage: true });
        throw error;
    } finally {
        await browser.close();
    }
}

async function main() {
    try {
        console.log('🚀 Starting DailyMannaAI Reach Booster (Manual Sync with PlayTune)...');

        // 1. Trend Discovery
        let match = null;
        for (const loc of LOCATIONS) {
            const trends = await getTrends(loc.path);
            match = findDevotionalTrend(trends);
            if (match) {
                console.log(`✅ Matched Trend: ${match.trend}`);
                break;
            }
        }

        // Content generation
        const verses = [
            {
                ref: "Psalm 46:10",
                text: "Be still, and know that I am God.",
                meditation: "In the rush of a busy morning, find peace in His sovereignty. He is in control.",
                prayer: "Lord, help me to rest in Your presence today. (Tap ❤️ if you agree!)"
            }
        ];

        const v = verses[0];
        const trendTag = match ? `#${match.trend.replace(/\s/g, '').replace(/#/g, '')}` : "#Faith";

        const threadItems = [
            `📖 Daily Manna: ${v.ref}\n\n"${v.text}"\n\n${trendTag} #DailyMannaAI #BibleVerse #Faith`,
            `💡 Meditation: ${v.meditation} ✨`,
            `🙏 Prayer: ${v.prayer}`
        ];

        if (process.env.DRY_RUN === 'true') {
            console.log('🧪 DRY_RUN active. Would have posted:');
            threadItems.forEach((t, i) => console.log(`[${i + 1}]: ${t}`));
            return;
        }

        // 2. Browser Automation
        await postTweetViaPlaywright(threadItems);

        console.log('✅ Script execution finished.');
    } catch (err) {
        console.error('❌ Fatal Script Error:', err);
        process.exit(1);
    }
}

main();
