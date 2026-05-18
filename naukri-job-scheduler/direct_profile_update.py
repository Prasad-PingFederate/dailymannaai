import asyncio
import json
import logging
from pathlib import Path
from cloakbrowser import launch_async

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s — %(message)s')
logger = logging.getLogger("direct_profile_update")

async def main():
    pdf_path = Path("config/career-ops/output/cv-candidate-hatica-2026-05-18.pdf")
    if not pdf_path.exists():
        logger.error(f"❌ Resume file not found at {pdf_path}")
        return
        
    logger.info(f"🚀 Launching headed CloakBrowser to upload tailored resume: {pdf_path.name}")
    browser = await launch_async(
        headless=False,
        args=[
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--window-size=1280,800"
        ]
    )
    
    try:
        context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            locale="en-IN",
            timezone_id="Asia/Kolkata"
        )
        
        # Load active session cookies
        session_file = Path("data/naukri_session.json")
        if session_file.exists():
            cookies = json.loads(session_file.read_text())
            await context.add_cookies(cookies)
            logger.info("🔑 Loaded session cookies.")
            
        page = await context.new_page()
        
        # Go to profile
        logger.info("⚡ Navigating to Naukri profile page...")
        await page.goto("https://www.naukri.com/mnjuser/profile", wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(3000)
        
        # Check if we landed on the homepage and have the 'Complete profile' button visible
        complete_btn = await page.query_selector("body > main > div > div > div.user-details.br-10.border.left-section > div > div.other-info-wrapper > div.view-profile-wrapper > a, a:has-text('Complete profile'), button:has-text('Complete profile'), .complete-profile")
        if complete_btn and await complete_btn.is_visible():
            logger.info("🖱️ Found 'Complete profile' button on home page! Clicking to navigate to profile page...")
            await complete_btn.click()
            await page.wait_for_timeout(4000)
        
        # Strategy A: Check for the dummy 'Update resume' button layout
        logger.info("🔍 Checking for dummy 'Update resume' button layout...")
        dummy_upload = await page.query_selector("input[type='button'][value='Update resume'], input.dummyUpload, .dummyUpload")
        uploaded = False
        if dummy_upload and await dummy_upload.is_visible():
            try:
                logger.info("🖱️ Found dummy 'Update resume' button! Initiating file chooser listener...")
                async with page.expect_file_chooser(timeout=10000) as fc_info:
                    await dummy_upload.click()
                file_chooser = await fc_info.value
                logger.info(f"📤 Uploading resume: {pdf_path.name} via file chooser dialog...")
                await file_chooser.set_files(str(pdf_path.resolve()))
                await page.wait_for_timeout(5000)
                logger.info("✅ Successfully uploaded and updated resume via dummy upload dialog!")
                uploaded = True
            except Exception as fc_err:
                logger.warning(f"⚠️ File chooser strategy failed ({fc_err}). Falling back to direct input field...")

        if not uploaded:
            # Strategy B: Fallback to direct hidden file input element (#attachCV)
            logger.info("🔍 Searching for direct resume upload input (#attachCV) on profile page...")
            file_input = await page.wait_for_selector("input[type='file']#attachCV, input[type='file'][id*='attach']", timeout=15000)
            if file_input:
                logger.info(f"📤 Uploading resume: {pdf_path.name} directly to Naukri profile...")
                await file_input.set_input_files(str(pdf_path.resolve()))
                await page.wait_for_timeout(5000)
                logger.info("✅ Successfully uploaded and updated resume on your Naukri profile!")
            else:
                logger.error("❌ Could not find any resume upload elements on Naukri profile page.")
            
        logger.info("⏳ Browser will remain open for 20 seconds for verification...")
        await page.wait_for_timeout(20000)
        
    except Exception as e:
        logger.error(f"❌ Error occurred: {e}")
    finally:
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
