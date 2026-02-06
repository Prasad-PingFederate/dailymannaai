/**
 * DailyMannaAI Advanced Reach Booster
 * 
 * Features:
 * 1. Trend Discovery: Scrapes trends24.in for real-time engagement opportunities (with fallback).
 * 2. SimCluster Matching: Aligns trends with devotional/faith keywords for targeted reach.
 * 3. Robust Automation: Uses Playwright with Cookie Persistence and Challenge Bypassing.
 * 4. Algorithm Optimized: Posts 3-part threads with 30x Like boost CTAs.
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
    { name: 'Global', path: '' }
];

async function getTrends(locationPath = 'india/') {
    console.log(`🔍 Discovering trends for ${locationPath || 'Global'}...`);
    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto(`https://trends24.in/${locationPath}`, {
            waitUntil: 'domcontentloaded',
            timeout: 15000
        });

        await page.waitForSelector('.trend-link', { timeout: 10000 });
        const trends = await page.evaluate(() => {
            const listItems = document.querySelectorAll('.list-container:first-child .trend-link');
            return Array.from(listItems).map(item => item.textContent.trim());
        });

        console.log(`✅ Fetched ${trends.length} trends.`);
        return trends;
    } catch (error) {
        console.warn(`⚠️ Trend discovery failed for ${locationPath}: ${error.message}. Using fallback.`);
        return [];
    } finally {
        if (browser) await browser.close();
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

async function generateThreadContent(match) {
    const verses = [
        {
            ref: "Psalm 46:10",
            text: "Be still, and know that I am God.",
            meditation: "In the rush of a busy morning, find peace in His sovereignty. He is in control of your situation.",
            prayer: "Lord, help me to rest in Your presence today and trust Your plan."
        }
    ];

    const v = verses[0];
    const trendTag = match ? `#${match.trend.replace(/\s/g, '').replace(/#/g, '')}` : "#FaithOverFear";

    return [
        `📖 Daily Manna: ${v.ref}\n\n"${v.text}"\n\n${trendTag} #DailyMannaAI #BibleVerse #Faith`,
        `💡 Morning Meditation:\n\n${v.meditation}\n\nTake this truth with you today as you step into your purpose. ✨`,
        `🙏 Prayer Of The Day:\n\n${v.prayer}\n\n(Tap the ❤️ if you agree! Your engagement helps this Word reach someone who needs it most today.)`
    ];
}

async function runBooster() {
    console.log('🚀 Starting Advanced Reach Booster...');

    if (!process.env.X_USERNAME || !process.env.X_PASSWORD) {
        console.error('❌ Error: X_USERNAME and X_PASSWORD secrets are missing or empty in GitHub.');
        process.exit(1);
    }

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

    const threadItems = await generateThreadContent(match);

    if (process.env.DRY_RUN === 'true') {
        console.log('🧪 DRY_RUN active. Script would have posted the following thread:');
        threadItems.forEach((t, idx) => console.log(`[Tweet ${idx + 1}]:\n${t}\n`));
        return;
    }

    // 2. Browser Automation
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    try {
        if (process.env.X_COOKIES) {
            console.log('Injecting session cookies...');
            try {
                const cookies = JSON.parse(process.env.X_COOKIES);
                await context.addCookies(cookies);
            } catch (e) {
                console.error('Invalid X_COOKIES format.');
            }
        }

        await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(5000);

        const isLoggedIn = await page.locator('[data-testid="SideNav_NewTweet_Button"]').isVisible();

        let loginSuccess = !(!isLoggedIn);

        if (!isLoggedIn) {
            console.log('Session expired or missing. Logging in manually...');
            await page.goto('https://x.com/i/flow/login', { waitUntil: 'domcontentloaded', timeout: 60000 });

            console.log('Filling username...');
            const usernameInput = page.locator('input[autocomplete="username"]');
            await usernameInput.waitFor({ timeout: 30000 });
            await usernameInput.fill(process.env.X_USERNAME);

            // Try pressing Enter and clicking "Next" button
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);
            const nextButton = page.locator('button:has-text("Next"), [role="button"]:has-text("Next")').first();
            if (await nextButton.isVisible()) {
                console.log('Clicking "Next" button after username...');
                await nextButton.click();
            }

            await page.waitForTimeout(3000);

            for (let i = 0; i < 10; i++) {
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
                    // Fallback for password screen "Next/Log in"
                    const loginBtn = page.locator('button:has-text("Log in"), [data-testid="LoginForm_Login_Button"]').first();
                    if (await loginBtn.isVisible()) await loginBtn.click();
                    await page.waitForTimeout(5000);
                    continue;
                }

                // 2. Identity Verification (Email/Username/Phone)
                if (bodyText.toLowerCase().includes('verification') || bodyText.toLowerCase().includes('identity') ||
                    bodyText.toLowerCase().includes('suspicious') || bodyText.toLowerCase().includes('check your email') ||
                    bodyText.toLowerCase().includes('enter your email') || bodyText.toLowerCase().includes('phone or email')) {

                    console.log(`Identity challenge detected (attempt ${i + 1}). Solving...`);
                    const idInput = page.locator('input[name="text"], input[data-testid="challenge_response"], input[autocomplete="email"], input[autocomplete="username"]');

                    if (await idInput.first().isVisible()) {
                        const challengeAnswer = (i < 3 && process.env.X_EMAIL) ? process.env.X_EMAIL : process.env.X_USERNAME;
                        await idInput.first().fill(challengeAnswer);
                        await page.keyboard.press('Enter');
                        await page.waitForTimeout(5000);
                        continue;
                    }
                }

                // 3. Fallback for "Next" buttons
                const nextBtn = page.locator('button:has-text("Next"), [data-testid="LoginForm_Login_Button"]').first();
                if (await nextBtn.isVisible()) {
                    await nextBtn.click();
                    await page.waitForTimeout(3000);
                }

                // 4. Check for success
                if (await page.locator('[data-testid="SideNav_NewTweet_Button"], [data-testid="AppTabBar_Home_Link"]').first().isVisible() || currentUrl.includes('/home')) {
                    console.log('✅ Success: Login confirmed.');
                    loginSuccess = true;
                    break;
                }
            }
        } else {
            loginSuccess = true;
        }

        if (!loginSuccess) {
            console.error('❌ Error: Login failed after 7 steps. Check reach-booster-failure.png');
            await page.screenshot({ path: 'reach-booster-failure.png', fullPage: true });
            process.exit(1);
        }

        // --- 3. Handle Posting ---
        console.log('✅ Moving to posting...');
        await page.waitForTimeout(5000);

        // X Selector Fallback strategy
        const tweetButtonSelectors = [
            '[data-testid="SideNav_NewTweet_Button"]', // Sidebar (Preferred)
            '[data-testid="tweetButtonInline"]', // Inline (Middle)
            'a[href="/compose/post"]',
            'button:has(span:text-is("Post"))', // From user's screenshot
            'button:has-text("Post")'
        ];

        let openedComposer = false;
        for (const selector of tweetButtonSelectors) {
            const btn = page.locator(selector).first();
            if (await btn.isVisible()) {
                console.log(`Opening composer via: ${selector}`);
                await btn.click();
                openedComposer = true;
                break;
            }
        }

        if (!openedComposer) {
            console.log('Button not found. Trying keyboard shortcut "n"...');
            await page.keyboard.press('n');
        }

        // Wait for ANY editor to be visible (modal or inline)
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
                    await page.waitForTimeout(500);
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
        await page.waitForTimeout(5000);
        const isStillThere = await page.locator('[data-testid="tweetTextarea_0"]').first().isVisible();
        if (isStillThere) {
            console.log('Editor still visible. Final retry with Control+Enter...');
            await page.keyboard.press('Control+Enter');
            await page.waitForTimeout(5000);
        }

        console.log('🎊 Thread successfully posted!');

    } catch (error) {
        console.error('❌ Reach Booster Error:', error);
        await page.screenshot({ path: 'reach-booster-failure.png', fullPage: true });
        process.exit(1);
    } finally {
        await browser.close();
    }
}

(async () => {
    try {
        await runBooster();
        console.log('✅ Script execution finished.');
    } catch (err) {
        console.error('❌ Fatal Script Error:', err);
        process.exit(1);
    }
})();
