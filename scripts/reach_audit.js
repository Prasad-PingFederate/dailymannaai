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
            await page.goto('https://x.com/i/flow/login', { waitUntil: 'networkidle' });
            const arkosePresent = await page.frames().find(f => f.url().includes('arkoselabs')) ||
                await page.locator('iframe[src*="arkoselabs"]').first().isVisible().catch(() => false);

            if (arkosePresent) {
                this.results.arkose_threat_level = '🔥 HIGH (Instant CAPTCHA triggered)';
                this.results.vulnerabilities.push('WARNING: X is forcing a CAPTCHA immediately upon landing.');
            }

            // 3. User-Agent Stealth Test
            const isBot = await page.evaluate(() => navigator.webdriver);
            this.results.ua_stealth = isBot ? '❌ DETECTED (WebDriver found)' : '✅ STEALTH (Hidden)';

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
