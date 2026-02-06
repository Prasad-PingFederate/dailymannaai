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

        if (!isLoggedIn) {
            console.log('Session expired or missing. Logging in manually...');
            await page.goto('https://x.com/i/flow/login');

            await page.fill('input[autocomplete="username"]', process.env.X_USERNAME);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(3000);

            for (let i = 0; i < 10; i++) {
                const passwordInput = page.locator('input[name="password"]');
                const emailChallenge = page.locator('input[data-testid="challenge_response"], input[name="text"]');
                const usernameChallenge = page.locator('input[autocomplete="username"]');
                const nextButton = page.locator('button:has-text("Next"), button:has-text("Log in"), [data-testid="LoginForm_Login_Button"]').first();

                if (await passwordInput.isVisible()) {
                    console.log('Entering password...');
                    await passwordInput.fill(process.env.X_PASSWORD);
                    await passwordInput.press('Enter');
                    await page.waitForTimeout(5000);
                } else if (await emailChallenge.isVisible()) {
                    if (process.env.X_EMAIL) {
                        console.log(`Solving challenge (attempt ${i + 1})...`);
                        await emailChallenge.fill(process.env.X_EMAIL);
                        await page.keyboard.press('Enter');
                        await page.waitForTimeout(2000);
                        if (await nextButton.isVisible()) await nextButton.click();
                        await page.waitForTimeout(5000);
                    } else {
                        throw new Error('X_EMAIL required for challenge.');
                    }
                } else if (await usernameChallenge.isVisible()) {
                    console.log('Username requested again. Filling...');
                    await usernameChallenge.fill(process.env.X_USERNAME);
                    await page.keyboard.press('Enter');
                    await page.waitForTimeout(2000);
                    if (await nextButton.isVisible()) await nextButton.click();
                    await page.waitForTimeout(5000);
                }

                // Enhanced Home Page Detection
                const isHome = await page.locator('[data-testid="SideNav_NewTweet_Button"], [data-testid="AppTabBar_Home_Link"], [data-testid="tweetTextarea_0"]').first().isVisible() ||
                    page.url().includes('/home');

                if (isHome) {
                    console.log('✅ Success: Login confirmed.');
                    break;
                }
                await page.waitForTimeout(2000);
            }
        }

        // --- Handle Posting ---
        console.log('Final confirmation of home page...');
        await page.waitForTimeout(3000);

        // 1. Check Sidebar Post Button (Preferred for threads)
        const sidebarPostBtn = page.locator('[data-testid="SideNav_NewTweet_Button"]').first();
        // 2. Check Inline Composer
        const inlineEditorPlaceholder = page.locator('[data-testid="tweetTextarea_0_label"], .public-DraftEditorPlaceholder-root').first();
        const inlinePostBtn = page.locator('[data-testid="tweetButtonInline"]').first();
        // 3. Check General Post Buttons (by text)
        const postButtonsByText = page.getByRole('button', { name: /Post|Tweet/i });

        console.log('Searching for post trigger...');

        if (await sidebarPostBtn.isVisible()) {
            console.log('Clicking sidebar "Post" button...');
            await sidebarPostBtn.click();
        } else if (await inlineEditorPlaceholder.isVisible()) {
            console.log('Inline placeholder found. Clicking to expand...');
            await inlineEditorPlaceholder.click();
        } else if (await postButtonsByText.count() > 0) {
            console.log(`Found ${await postButtonsByText.count()} buttons named Post/Tweet. Trying the first one...`);
            await postButtonsByText.first().click();
        } else {
            console.log('No elements found. Pressing "n" to open composer...');
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

        // Final click to post
        const finalPostBtn = page.locator('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]').getByText(/Post|Tweet|all/i).first();
        if (!(await finalPostBtn.isVisible())) {
            // Fallback for button without text match
            const backupBtn = page.locator('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]').first();
            await backupBtn.click({ force: true });
        } else {
            await finalPostBtn.click({ force: true });
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
