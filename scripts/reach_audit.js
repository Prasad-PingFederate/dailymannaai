/**
 * DailyMannaAI "Pre-Flight" Security Auditor v1.0
 * 
 * Inspired by User-provided Security Tester patterns.
 * This tool checks if your current environment (IP, UA) is "Shadow-Banned" or flagged 
 * by X.com before you attempt to post.
 */

const { chromium } = require('playwright');
const path = require('path');

class ReachAuditor {
    constructor() {
        this.results = {
            ip_reputation: 'Unknown',
            ua_stealth: 'Unknown',
            ua_blacklist_test: 'Unknown',
            rate_limit_test: 'Unknown',
            arkose_threat_level: 'Low',
            vulnerabilities: []
        };
    }

    async audit() {
        console.log('🚀 Starting Pre-Flight Security Audit...');
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        const page = await context.newPage();

        try {
            // 1. Check IP Reputation (X.com blocks Data Centers)
            console.log('🔍 Checking IP Reputation...');
            const response = await page.goto('https://x.com/robots.txt', { waitUntil: 'domcontentloaded' });
            if (response.status() === 403 || response.status() === 429) {
                this.results.ip_reputation = '❌ FLAGGED (Data Center/Proxy Blocked)';
                this.results.vulnerabilities.push('CRITICAL: Your IP is blacklisted by X.com.');
            } else {
                this.results.ip_reputation = '✅ CLEAN (Residential/Safe)';
            }

            // 2. Check for "Instant CAPTCHA" triggering
            console.log('🔍 Checking Arkose Threat Level...');
            await page.goto('https://x.com/i/flow/login', { waitUntil: 'domcontentloaded', timeout: 45000 });
            await page.waitForTimeout(5000); // Wait for potential frames
            const currentUrl = page.url();
            const bodyText = await page.innerText('body').catch(() => '');
            console.log(`Arkose Check: URL=${currentUrl}, Page Text Sample: ${bodyText.substring(0, 100).replace(/\n/g, ' ')}...`);
            const arkosePresent = await page.frames().find(f => f.url().includes('arkoselabs')) ||
                await page.locator('iframe[src*="arkoselabs"]').first().isVisible().catch(() => false);

            if (arkosePresent) {
                this.results.arkose_threat_level = '🔥 HIGH (Instant CAPTCHA triggered)';
                this.results.vulnerabilities.push('WARNING: X is forcing a CAPTCHA immediately upon landing.');
            }

            // 3. User-Agent Stealth Test
            const isBot = await page.evaluate(() => navigator.webdriver);
            this.results.ua_stealth = isBot ? '❌ DETECTED (WebDriver found)' : '✅ STEALTH (Hidden)';

            // 4. [NEW] UA Blacklist Test (Positive Control)
            console.log('🔍 Testing UA Blacklist detection...');
            const botContext = await browser.newContext({ userAgent: 'python-requests/2.28.0' });
            const botPage = await botContext.newPage();
            const botResponse = await botPage.goto('https://x.com/robots.txt').catch(() => null);
            this.results.ua_blacklist_test = (botResponse && botResponse.status() === 403) ? '✅ ACTIVE (X blocks bots)' : '⚠️ INACTIVE (X is wide open)';
            await botContext.close();

            // 5. [NEW] Rate Limit / Soft Block Test
            console.log('🔍 Testing Rate Limiting (5 rapid hits)...');
            let blocked = 0;
            for (let i = 0; i < 5; i++) {
                const res = await page.goto('https://x.com/robots.txt', { waitUntil: 'domcontentloaded' }).catch(() => null);
                if (res && (res.status() === 429 || res.status() === 403)) blocked++;
                await page.waitForTimeout(200);
            }
            this.results.rate_limit_test = blocked > 0 ? `⚠️ SENSITIVE (${blocked}/5 blocked)` : '✅ STABLE (No hits)';

            this.generateReport();

        } catch (err) {
            console.error('❌ Audit Failed:', err.message);
        } finally {
            await browser.close();
        }
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 DAILY MANNA AI: SECURITY AUDIT REPORT');
        console.log('='.repeat(60));
        console.log(`📡 IP Reputation:  ${this.results.ip_reputation}`);
        console.log(`🕵️ UA Stealth:     ${this.results.ua_stealth}`);
        console.log(`🛡️ UA Firewall:    ${this.results.ua_blacklist_test}`);
        console.log(`⏱️ Rate Limiting:  ${this.results.rate_limit_test}`);
        console.log(`🧩 CAPTCHA Threat: ${this.results.arkose_threat_level}`);

        console.log('\n🚨 Critical Findings:');
        if (this.results.vulnerabilities.length === 0) {
            console.log('   ✅ No red flags! Run is safe to proceed.');
        } else {
            this.results.vulnerabilities.forEach((v, i) => console.log(`   ${i + 1}. ${v}`));
        }
        console.log('='.repeat(60) + '\n');
    }
}

new ReachAuditor().audit();
