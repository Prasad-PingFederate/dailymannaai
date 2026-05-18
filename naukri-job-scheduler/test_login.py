import asyncio
import os
from pathlib import Path
import json
import logging

# Set up logging before imports to keep output clean
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s — %(message)s')
logger = logging.getLogger("test_login")

from src.apply_automation import load_env_keys, perform_google_login, launch_async, perform_google_sso_flow

async def main():
    logger.info("🚀 Launching headed browser for Google SSO test...")
    browser = await launch_async(
        headless=False,
        args=[
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--window-size=1280,800"
        ]
    )
    context = await browser.new_context(
        viewport={"width": 1280, "height": 800},
        locale="en-IN",
        timezone_id="Asia/Kolkata"
    )
    page = await context.new_page()
    
    env_keys = load_env_keys()
    username = env_keys.get("EMAIL_SENDER", "prasaddammai1@gmail.com")
    password = env_keys.get("NAUKRI_PASSWORD") or env_keys.get("NAUKARI_PASSWORD") or env_keys.get("EMAIL_PASSWORD") or ""
    
    logger.info(f"🔑 Target email: {username}")
    logger.info(f"🔑 Target password length: {len(password) if password else 0}")
    
    session_file = Path("data/naukri_session.json")
    job_url = "https://www.naukri.com/nlogin/login"
    
    # Navigate to Naukri login page
    await page.goto(job_url, wait_until="domcontentloaded", timeout=60000)
    await page.wait_for_timeout(3000)
    
    google_btn = await page.query_selector("a.socialbtn.google, a.google, [class*='google'], [id*='google']")
    if google_btn:
        logger.info("🖱️ Clicking 'Continue with Google' button...")
        try:
            async with context.expect_page(timeout=8000) as popup_info:
                await google_btn.click()
            sso_page = await popup_info.value
            logger.info("📱 Detected Google SSO popup window! Automating inside popup...")
        except Exception:
            logger.info("ℹ️ No popup window detected. Assuming same-window redirect.")
            sso_page = page
            
        sso_success = await perform_google_sso_flow(sso_page, username, password)
        if sso_success:
            logger.info("✅ Automated Google SSO form entries completed!")
        else:
            logger.warning("⚠️ Automated SSO flow skipped/incomplete. You can manually interact with the browser now.")
            
    # Wait for manual check or logout button
    logger.info("⏳ Browser will remain open for 120 seconds. Please manually complete the login and 2FA now...")
    for i in range(60):
        await page.wait_for_timeout(2000)
        login_btn = await page.query_selector("#login_Layer, .login-btn, a[href*='login']")
        profile = await page.query_selector(".nI-g_profile, a[href*='logout'], [class*='profile'], [href*='logout']")
        if (login_btn and not await login_btn.is_visible()) or not login_btn or profile:
            logger.info("✅ Login detected! Saving cookies session...")
            cookies = await context.cookies()
            session_file.parent.mkdir(exist_ok=True)
            session_file.write_text(json.dumps(cookies, indent=2))
            break
            
    await browser.close()
    logger.info("🏁 Test completed.")

if __name__ == "__main__":
    asyncio.run(main())
