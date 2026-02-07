/**
 * DailyMannaAI Login Helper (Interactive Mode)
 * 
 * USE THIS SCRIPT ON YOUR LOCAL COMPUTER TO CAPTURE COOKIES.
 * 1. Run: `node scripts/login_helper.js`
 * 2. A real browser will open.
 * 3. Log in manually, solve any CAPTCHAs, and wait for the Home page.
 * 4. The script will save your session to 'cookies.json'.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function captureSession() {
    console.log('🚀 Opening Interactive Browser...');
    console.log('👉 Please log in manually and wait for the Home page.');

    const browser = await chromium.launch({ headless: false }); // Show the browser
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://x.com/i/flow/login');

    // Wait for the user to reach the home page (up to 5 minutes)
    try {
        await page.waitForSelector('[data-testid="SideNav_NewTweet_Button"]', { timeout: 300000 });
        console.log('✅ Home page detected!');

        const cookies = await context.cookies();
        const cookiesString = JSON.stringify(cookies);

        fs.writeFileSync(path.join(__dirname, '../cookies.json'), cookiesString);

        console.log('----------------------------------------------------');
        console.log('✨ SESSION CAPTURED SUCCESSFULLY! ✨');
        console.log('1. Open the file "cookies.json" in this directory.');
        console.log('2. Copy the entire text inside.');
        console.log('3. Go to GitHub -> Settings -> Secrets -> Actions.');
        console.log('4. Create/Update a secret named: X_COOKIES');
        console.log('5. Paste the text there.');
        console.log('----------------------------------------------------');

    } catch (e) {
        console.error('❌ Timeout or error during login:', e.message);
    } finally {
        await browser.close();
    }
}

captureSession();
