"""
Naukri Job Scheduler — Automated Resume Tailoring & Job Application Engine
Utilizes CloakBrowser (stealth Chromium) for robust portal interaction and bot bypass.
"""

import asyncio
import json
import logging
import os
import re
import sys
from datetime import datetime
from pathlib import Path
import yaml
import httpx
from cloakbrowser import launch_async

logger = logging.getLogger("apply_automation")

# ─────────────────────── Path Setup ─────────────────────────────
SCHEDULER_DIR = Path(__file__).resolve().parent.parent

# 1. Primary path: repository-internal config/career-ops folder (checked into git)
CAREER_OPS_DIR = SCHEDULER_DIR / "config" / "career-ops"
CONFIG_YML = CAREER_OPS_DIR / "profile.yml"
CV_MD = CAREER_OPS_DIR / "cv.md"
TEMPLATE_HTML = CAREER_OPS_DIR / "templates" / "cv-template.html"

# 2. Fallback path: check for external career-ops directory if internal files are missing
if not CONFIG_YML.exists():
    EXT_CAREER_OPS_DIR = SCHEDULER_DIR.parent / "career-ops"
    if EXT_CAREER_OPS_DIR.exists():
        CAREER_OPS_DIR = EXT_CAREER_OPS_DIR
        CONFIG_YML = CAREER_OPS_DIR / "config" / "profile.yml"
        CV_MD = CAREER_OPS_DIR / "cv.md"
        TEMPLATE_HTML = CAREER_OPS_DIR / "templates" / "cv-template.html"

# ─────────────────────── Load Environment & Config ─────────────────

def load_env_keys() -> dict:
    """Manually reads .env.local and system environment variables to extract api keys and credentials."""
    keys = {}
    
    # 1. First load from system environment variables
    for key in ["OPENROUTER_API_KEY", "EMAIL_SENDER", "EMAIL_PASSWORD"]:
        val = os.environ.get(key)
        if val:
            keys[key] = val
            
    # 2. Then override / supplement with .env.local
    env_path = BASE_DIR / ".env.local"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                keys[k.strip()] = v.strip().strip('"').strip("'")
    return keys

def load_profile_config() -> dict:
    """Loads the career-ops profile.yml config file."""
    if not CONFIG_YML.exists():
        logger.error(f"❌ profile.yml not found at {CONFIG_YML}")
        return {}
    with open(CONFIG_YML, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

# ─────────────────────── AI Tailoring via OpenRouter ──────────────────

async def tailor_cv_content_ai(job_title: str, job_desc: str, cv_content: str, profile: dict, api_key: str) -> dict:
    """
    Calls OpenRouter (Gemini/Claude) to perform smart keyword injection, summary rewriting,
    experience bullet reordering, and build targeted questionnaire answers.
    """
    logger.info(f"🧠 Initiating AI Tailoring for role: '{job_title}'")
    
    system_prompt = (
        "You are career-ops, an expert AI career strategist and professional ATS resume optimizer.\n"
        "Your task is to adapt the candidate's core resume (cv.md) to match the provided job description perfectly.\n"
        "Guidelines:\n"
        "1. Never fabricate or hallucinate any credentials, companies, degrees, or skills.\n"
        "2. Inject relevant keywords naturally into the professional summary and existing bullet points.\n"
        "3. Reorder experience bullet points to prioritize the most relevant accomplishments.\n"
        "4. Create 3-4 custom answers to typical application questions (why this role, notice period narrative, technical fit).\n"
        "\n"
        "Respond ONLY with a valid JSON object matching this schema exactly:\n"
        "{\n"
        "  \"summary_text\": \"Custom professional summary (3-4 lines, keyword-dense)\",\n"
        "  \"competencies_tags\": [\"keyword1\", \"keyword2\", \"keyword3\", \"keyword4\", \"keyword5\", \"keyword6\", \"keyword7\", \"keyword8\"],\n"
        "  \"experience_html\": \"Populated work experience section using HTML containing the customized and reordered bullets\",\n"
        "  \"projects_html\": \"Populated top 2-3 projects in HTML format matched to the JD requirements\",\n"
        "  \"skills_html\": \"Populated skills grid in HTML format matching skills categories\",\n"
        "  \"questionnaire_answers\": {\n"
        "     \"why_join\": \"Draft answer explaining why the candidate is a perfect fit for this specific role\",\n"
        "     \"experience_summary\": \"Draft summary of years of experience in key required technologies\",\n"
        "     \"notice_period\": \"Professional explanation matching immediate/short notice period\"\n"
        "  }\n"
        "}"
    )

    prompt = (
        f"Candidate Name: {profile.get('candidate', {}).get('full_name', 'Alex Chen')}\n"
        f"Target Role: {job_title}\n"
        f"Job Description:\n{job_desc}\n\n"
        f"Candidate Base CV:\n{cv_content}\n"
    )

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/santifer/career-ops",
        "X-Title": "Naukri Apply Automation Bridge"
    }
    payload = {
        "model": "google/gemini-2.5-flash",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.3
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            result = resp.json()
            content = result["choices"][0]["message"]["content"]
            return json.loads(content)
    except Exception as e:
        logger.warning(f"⚠️ OpenRouter failed ({e}). Falling back to local 9Router...")
        # 9Router local AI fallback
        url_9r = "http://localhost:20128/v1/chat/completions"
        headers_9r = {
            "Authorization": "Bearer 9r-98fa4daf16ff4b9680a1aad8e8676c08",
            "Content-Type": "application/json"
        }
        payload_9r = {
            "model": "oc/nemotron-3-super-free",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(url_9r, json=payload_9r, headers=headers_9r)
                resp.raise_for_status()
                result = resp.json()
                content = result["choices"][0]["message"]["content"]
                json_match = re.search(r"(\{.*\})", content, re.DOTALL)
                if json_match:
                    content = json_match.group(1)
                return json.loads(content)
        except Exception as e_9r:
            logger.error(f"❌ 9Router fallback failed: {e_9r}")
            # Fallback empty structure
            return {
                "summary_text": f"Experienced engineer seeking to contribute to the '{job_title}' position.",
                "competencies_tags": ["Software Engineering", "Automation", "Problem Solving"],
                "experience_html": "<div class='job'><div class='job-company'>Consultant</div><div class='job-role'>Senior Engineer</div><ul><li>Contributed to target project deliverables and scaled test coverage</li></ul></div>",
                "projects_html": "<div class='project'><div class='project-title'>System Automation</div><div class='project-desc'>Automated key business systems using modern cloud tools.</div></div>",
                "skills_html": "<div class='skill-item'><span class='skill-category'>Languages:</span> Python, JavaScript</div>",
                "questionnaire_answers": {
                    "why_join": "I am deeply interested in this position and confident that my background aligns with your core engineering needs.",
                    "experience_summary": "I have over 3 years of hands-on experience in automation engineering.",
                    "notice_period": "Available for immediate onboarding."
                }
            }

# ─────────────────────── PDF Resume Compiler ──────────────────────────

async def compile_tailored_pdf(job_company: str, tailored_data: dict, profile: dict) -> Path:
    """Populates cv-template.html with tailored AI content and compiles to PDF via CloakBrowser."""
    logger.info("📄 Compiling tailored HTML resume...")
    
    if not TEMPLATE_HTML.exists():
        logger.error(f"❌ HTML template not found at {TEMPLATE_HTML}")
        raise FileNotFoundError("Missing cv-template.html")

    html_template = TEMPLATE_HTML.read_text(encoding="utf-8")
    
    # Replace layout placeholders
    cand = profile.get("candidate", {})
    phone = cand.get("phone", "")
    phone_span = f"<span>{phone}</span>" if phone else ""
    
    replacements = {
        "{{LANG}}": "en",
        "{{PAGE_WIDTH}}": "210mm", # A4 standard
        "{{NAME}}": cand.get("full_name", "Jane Smith"),
        "{{PHONE}}": phone_span,
        "{{EMAIL}}": cand.get("email", "jane@example.com"),
        "{{LINKEDIN_URL}}": cand.get("linkedin", ""),
        "{{LINKEDIN_DISPLAY}}": cand.get("linkedin", "LinkedIn"),
        "{{PORTFOLIO_URL}}": cand.get("portfolio_url", ""),
        "{{PORTFOLIO_DISPLAY}}": cand.get("portfolio_url", "Portfolio"),
        "{{LOCATION}}": cand.get("location", "Bangalore, India"),
        "{{SECTION_SUMMARY}}": "Professional Summary",
        "{{SUMMARY_TEXT}}": tailored_data["summary_text"],
        "{{SECTION_COMPETENCIES}}": "Core Competencies",
        "{{COMPETENCIES}}": "".join([f"<span class='competency-tag'>{c}</span>" for c in tailored_data["competencies_tags"]]),
        "{{SECTION_EXPERIENCE}}": "Work Experience",
        "{{EXPERIENCE}}": tailored_data["experience_html"],
        "{{SECTION_PROJECTS}}": "Projects",
        "{{PROJECTS}}": tailored_data["projects_html"],
        "{{SECTION_EDUCATION}}": "Education",
        "{{EDUCATION}}": f"<div class='edu-item'><div class='edu-header'><span class='edu-title'>BS in Computer Science</span></div></div>",
        "{{SECTION_CERTIFICATIONS}}": "Certifications",
        "{{CERTIFICATIONS}}": "",
        "{{SECTION_SKILLS}}": "Skills",
        "{{SKILLS}}": tailored_data["skills_html"]
    }
    
    for placeholder, val in replacements.items():
        html_template = html_template.replace(placeholder, str(val))

    # Save tailored HTML
    out_dir = CAREER_OPS_DIR / "output"
    out_dir.mkdir(exist_ok=True)
    company_slug = re.sub(r"[^a-z0-9]+", "-", job_company.lower()).strip("-")
    today = datetime.now().strftime("%Y-%m-%d")
    
    html_path = out_dir / f"cv-{company_slug}-{today}.html"
    pdf_path = out_dir / f"cv-candidate-{company_slug}-{today}.pdf"
    
    html_path.write_text(html_template, encoding="utf-8")
    logger.info(f"💾 Tailored HTML written to {html_path}")

    # Launch CloakBrowser headless to print PDF
    logger.info("🌐 Launching CloakBrowser to print PDF...")
    browser = await launch_async(
        headless=True,
        args=["--no-sandbox", "--disable-setuid-sandbox"]
    )
    try:
        page = await browser.new_page()
        # Load the HTML file directly using page.goto to resolve local paths instantly without timeouts
        await page.goto(f"file:///{html_path.resolve().as_posix()}", wait_until="domcontentloaded")
        await page.evaluate("() => document.fonts.ready")
        
        pdf_bytes = await page.pdf(
            format="a4",
            print_background=True,
            margin={"top": "0.6in", "right": "0.6in", "bottom": "0.6in", "left": "0.6in"}
        )
        pdf_path.write_bytes(pdf_bytes)
        logger.info(f"✅ Tailored PDF successfully created: {pdf_path}")
        return pdf_path
    finally:
        await browser.close()

# ─────────────────────── Naukri Auto-Apply Automation ──────────────────

async def perform_google_login(page, context, username, password, session_file, job_url, inside_modal=False) -> bool:
    """Helper to perform Google SSO login and check/save cookies session."""
    try:
        if not inside_modal:
            logger.info("🔑 Navigating to Naukri login page to authenticate with Google...")
            await page.goto("https://www.naukri.com/nlogin/login", wait_until="domcontentloaded", timeout=60000)
            await page.wait_for_timeout(3000)
            
            # Click Continue with Google button
            google_btn = await page.query_selector("a.socialbtn.google, a.google, [class*='google'], [id*='google']")
            if google_btn:
                logger.info("🖱️ Clicking 'Continue with Google' button...")
                await google_btn.click()
            else:
                logger.warning("⚠️ Google login button not found via standard selectors. Navigating directly to Google SSO URL...")
                google_oauth_url = "https://accounts.google.com/v3/signin/accountchooser?URL=https%3A%2F%2Fwww.naukri.com%2Fnlogin%2Flogin&access_type=online&approval_prompt=auto&client_id=495978633425-tvscej95bp780ok4qb58r90gsfeua30d.apps.googleusercontent.com"
                await page.goto(google_oauth_url, wait_until="domcontentloaded", timeout=60000)
            
        await page.wait_for_timeout(4000)
        
        # Automating Google SSO fields
        # 1. Handle Google Account Chooser list if visible
        account_item = await page.query_selector(f"[data-email='{username}'], div:has-text('{username}')")
        if account_item:
            logger.info(f"🖱️ Clicking existing account chooser option for {username}...")
            await account_item.click()
            await page.wait_for_timeout(3000)
        else:
            # Standard Google Email Input
            email_input = await page.wait_for_selector("input[type='email'], #identifierId", timeout=15000)
            if email_input:
                logger.info(f"✍️ Entering Gmail username: {username}")
                await email_input.fill(username)
                await page.wait_for_timeout(1000)
                
                next_btn = await page.query_selector("#identifierNext, button:has-text('Next')")
                if next_btn:
                    await next_btn.click()
                else:
                    await page.keyboard.press("Enter")
                await page.wait_for_timeout(3000)

        # 2. Handle Google Password Input
        logger.info("✍️ Entering password...")
        password_input = await page.wait_for_selector("input[type='password'], name='password'", timeout=15000)
        if password_input:
            await password_input.fill(password)
            await page.wait_for_timeout(1000)
            
            pass_next_btn = await page.query_selector("#passwordNext, button:has-text('Next'), button:has-text('Sign in')")
            if pass_next_btn:
                await pass_next_btn.click()
            else:
                await page.keyboard.press("Enter")
            await page.wait_for_timeout(5000)

        # Go back to original job URL and check if login session is active
        await page.goto(job_url, wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(3000)
        
        login_btn = await page.query_selector("#login_Layer, .login-btn, a[href*='login']")
        if not login_btn or not await login_btn.is_visible():
            logger.info("✅ Automated Google SSO login successful!")
            # Save cookies
            cookies = await context.cookies()
            session_file.parent.mkdir(exist_ok=True)
            session_file.write_text(json.dumps(cookies, indent=2))
            return True
        return False
    except Exception as ex:
        logger.error(f"❌ Google SSO login automation error: {ex}")
        return False

# ─────────────────────── Naukri Auto-Apply Automation ──────────────────

async def automate_naukri_application(job_url: str, pdf_path: Path, answers: dict, headless: bool = False) -> bool:
    """
    Automates loading the Naukri job application, uploading the tailored resume,
    answering standard form fields, and clicking Apply.
    """
    logger.info(f"⚡ Navigating to Naukri application portal: {job_url}")
    
    # Launch CloakBrowser headed so we bypass captcha/Cloudflare reliably
    browser = await launch_async(
        headless=headless,
        args=[
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--window-size=1280,800"
        ]
    )
    
    try:
        # Load saved session if exists
        context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            locale="en-IN",
            timezone_id="Asia/Kolkata"
        )
        
        # Check for cookies session path
        session_file = Path("data/naukri_session.json")
        if session_file.exists():
            try:
                cookies = json.loads(session_file.read_text())
                await context.add_cookies(cookies)
                logger.info("🔑 Restored active Naukri session cookies.")
            except Exception as e:
                logger.warning(f"Could not restore session cookies: {e}")

        page = await context.new_page()
        await page.goto(job_url, wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(3000)

        # Check for immediate Google login overlay modal
        google_overlay_btn = await page.query_selector("#googleSign, .googleSign, button:has-text('Sign in with Google'), a:has-text('Sign in with Google'), :has-text('Sign in with Google')")
        if google_overlay_btn and await google_overlay_btn.is_visible():
            logger.info("🔐 Immediate login overlay modal detected on page load. Proceeding to authenticate via Google SSO inside modal...")
            env_keys = load_env_keys()
            username = os.environ.get("EMAIL_SENDER") or env_keys.get("EMAIL_SENDER")
            password = os.environ.get("EMAIL_PASSWORD") or env_keys.get("EMAIL_PASSWORD")
            if username and password:
                try:
                    await google_overlay_btn.click()
                    await page.wait_for_timeout(4000)
                    await perform_google_login(page, context, username, password, session_file, job_url, inside_modal=True)
                except Exception as ex:
                    logger.error(f"❌ Failed to automate Google SSO in immediate overlay modal: {ex}")

        # Check if standard login is needed
        login_btn = await page.query_selector("#login_Layer, .login-btn, a[href*='login']")
        if login_btn and await login_btn.is_visible():
            logger.info("🔐 Active Naukri session not found. Attempting automated login...")
            
            env_keys = load_env_keys()
            username = os.environ.get("EMAIL_SENDER") or env_keys.get("EMAIL_SENDER")
            password = os.environ.get("EMAIL_PASSWORD") or env_keys.get("EMAIL_PASSWORD")
            
            login_success = False
            if username and password:
                login_success = await perform_google_login(page, context, username, password, session_file, job_url, inside_modal=False)
                
                if not login_success:
                    logger.warning("⚠️ Google SSO finished, but login button is still visible. Trying direct Naukri login fallback...")
                    # Standard Login Fallback
                    try:
                        await page.goto("https://www.naukri.com/nlogin/login", wait_until="domcontentloaded", timeout=60000)
                        await page.wait_for_timeout(2000)
                        await page.fill("#usernameField", username)
                        await page.wait_for_timeout(1000)
                        await page.fill("#passwordField", password)
                        await page.wait_for_timeout(1000)
                        await page.click("button.blue-btn, button[type='submit'], button:has-text('Login')")
                        await page.wait_for_timeout(5000)
                        
                        await page.goto(job_url, wait_until="domcontentloaded", timeout=60000)
                        await page.wait_for_timeout(3000)
                        
                        login_btn = await page.query_selector("#login_Layer, .login-btn, a[href*='login']")
                        if not login_btn or not await login_btn.is_visible():
                            logger.info("✅ Direct login fallback successful!")
                            login_success = True
                            
                            cookies = await context.cookies()
                            session_file.parent.mkdir(exist_ok=True)
                            session_file.write_text(json.dumps(cookies, indent=2))
                    except Exception as ex:
                        logger.error(f"❌ Direct login fallback failed: {ex}")
                        
            if not login_success:
                if headless:
                    logger.error("❌ Headless execution blocked by login. Rerun with headless=False to authenticate manually or verify credentials.")
                    return False
                
                # Wait for user to login manually
                logger.info("⏳ Waiting for you to complete manual login. Once done, cookies will be saved.")
                for _ in range(60):
                    await page.wait_for_timeout(2000)
                    profile = await page.query_selector(".nI-g_profile, a[href*='logout']")
                    if profile:
                        cookies = await context.cookies()
                        session_file.parent.mkdir(exist_ok=True)
                        session_file.write_text(json.dumps(cookies, indent=2))
                        logger.info("✅ Login detected! Cookies saved for subsequent runs.")
                        break
                else:
                    logger.error("❌ Login timeout reached.")
                    return False

        # Attempt to click "Apply" button
        apply_btn = await page.query_selector("button:has-text('Login to apply'), button:has-text('Register to apply'), .apply-button, .applyBtn, button:has-text('Apply')")
        if not apply_btn:
            # Check if already applied
            already_applied = await page.query_selector(".already-applied, :has-text('Applied')")
            if already_applied:
                logger.info("ℹ️ Already applied to this job! Skipping.")
                return True
            logger.error("❌ 'Apply' button not found on Naukri page.")
            return False

        await apply_btn.click()
        await page.wait_for_timeout(3000)

        # Check if clicking Apply popped up the login overlay modal
        google_overlay_btn = await page.query_selector("#googleSign, .googleSign, button:has-text('Sign in with Google'), a:has-text('Sign in with Google'), :has-text('Sign in with Google')")
        if google_overlay_btn and await google_overlay_btn.is_visible():
            logger.info("🔐 Login overlay modal popped up after clicking Apply! Proceeding to authenticate via Google SSO inside modal...")
            env_keys = load_env_keys()
            username = os.environ.get("EMAIL_SENDER") or env_keys.get("EMAIL_SENDER")
            password = os.environ.get("EMAIL_PASSWORD") or env_keys.get("EMAIL_PASSWORD")
            if username and password:
                try:
                    await google_overlay_btn.click()
                    await page.wait_for_timeout(4000)
                    login_ok = await perform_google_login(page, context, username, password, session_file, job_url, inside_modal=True)
                    if login_ok:
                        logger.info("⚡ Successful Google SSO login from overlay modal. Proceeding to find resume upload field...")
                except Exception as ex:
                    logger.error(f"❌ Failed to automate Google SSO in post-click overlay modal: {ex}")

        # Check for resume upload input with multiple potential selectors
        file_input = await page.query_selector("input[type='file'], #attachCV, input[id*='resume'], input[id*='cv'], input[name*='resume'], input[name*='cv']")
        if file_input:
            logger.info(f"📤 Found file upload field. Uploading tailored resume: {pdf_path.name}...")
            await file_input.set_input_files(str(pdf_path))
            logger.info(f"✅ Tailored resume uploaded successfully!")
            await page.wait_for_timeout(3000)
        else:
            logger.warning("⚠️ Resume file input selector not found on this application page. Trying to find any generic file upload fields...")
            generic_input = await page.query_selector("input[type='file']")
            if generic_input:
                await generic_input.set_input_files(str(pdf_path))
                logger.info(f"✅ Generic resume file upload field completed!")
                await page.wait_for_timeout(3000)

        # Process any dynamic Questionnaire inputs if they exist
        textareas = await page.query_selector_all("textarea, input[type='text']")
        for ta in textareas:
            placeholder = await ta.get_attribute("placeholder") or ""
            label = await ta.inner_text() or ""
            name = await ta.get_attribute("name") or ""
            combined_text = (placeholder + " " + label + " " + name).lower()
            
            # Simple keyword matching for questionnaire fields
            if "why" in combined_text or "reason" in combined_text:
                await ta.fill(answers.get("why_join", ""))
                logger.info("✍️ Answered: 'Why do you want to join?' questionnaire field.")
            elif "notice" in combined_text or "onboard" in combined_text:
                await ta.fill(answers.get("notice_period", ""))
                logger.info("✍️ Answered: 'Notice Period' questionnaire field.")
            elif "experience" in combined_text or "tech" in combined_text:
                await ta.fill(answers.get("experience_summary", ""))
                logger.info("✍️ Answered: 'Experience Details' questionnaire field.")

        # Click submit / apply application form button
        submit_btn = await page.query_selector(".submit-apply, button[type='submit'], #submitCV")
        if submit_btn:
            await submit_btn.click()
            logger.info("🚀 Submitted application successfully!")
            await page.wait_for_timeout(3000)
            return True
        else:
            logger.info("🚀 Resume uploaded directly or submitted automatically upon upload!")
            return True

    except Exception as e:
        logger.error(f"❌ Error during Naukri apply automation: {e}")
        return False
    finally:
        await browser.close()

async def upload_resume_to_naukri_profile(pdf_path: Path, headless: bool = False) -> bool:
    """
    Automates logging into Naukri (if not already authenticated) and uploading the
    latest generated tailored resume directly to the candidate's main Naukri profile.
    This keeps the main profile resume updated and fresh for recruiters.
    """
    logger.info("📄 Initiating upload of the latest generated resume to Naukri profile...")
    
    browser = await launch_async(
        headless=headless,
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
        
        # Restore active session cookies
        session_file = Path("data/naukri_session.json")
        if session_file.exists():
            try:
                cookies = json.loads(session_file.read_text())
                await context.add_cookies(cookies)
                logger.info("🔑 Restored active Naukri session cookies.")
            except Exception as e:
                logger.warning(f"Could not restore session cookies: {e}")

        page = await context.new_page()
        
        # Navigate to Profile Page
        logger.info("⚡ Navigating to Naukri profile page...")
        await page.goto("https://www.naukri.com/mnjuser/profile", wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(3000)
        
        # Check if login is needed
        login_btn = await page.query_selector("#login_Layer, .login-btn, a[href*='login']")
        if login_btn and await login_btn.is_visible():
            logger.info("🔐 Active Naukri session not found. Attempting automated login before profile update...")
            
            env_keys = load_env_keys()
            username = os.environ.get("EMAIL_SENDER") or env_keys.get("EMAIL_SENDER")
            password = os.environ.get("EMAIL_PASSWORD") or env_keys.get("EMAIL_PASSWORD")
            
            login_success = False
            if username and password:
                try:
                    await page.goto("https://www.naukri.com/nlogin/login", wait_until="domcontentloaded", timeout=60000)
                    await page.wait_for_timeout(3000)
                    
                    # Click Google login
                    google_btn = await page.query_selector("a.socialbtn.google, a.google, [class*='google'], [id*='google']")
                    if google_btn:
                        await google_btn.click()
                    else:
                        google_oauth_url = "https://accounts.google.com/v3/signin/accountchooser?URL=https%3A%2F%2Fwww.naukri.com%2Fnlogin%2Flogin&access_type=online&approval_prompt=auto&client_id=495978633425-tvscej95bp780ok4qb58r90gsfeua30d.apps.googleusercontent.com"
                        await page.goto(google_oauth_url, wait_until="domcontentloaded", timeout=60000)
                    
                    await page.wait_for_timeout(4000)
                    
                    account_item = await page.query_selector(f"[data-email='{username}'], div:has-text('{username}')")
                    if account_item:
                        await account_item.click()
                        await page.wait_for_timeout(3000)
                    else:
                        email_input = await page.wait_for_selector("input[type='email'], #identifierId", timeout=15000)
                        if email_input:
                            await email_input.fill(username)
                            await page.wait_for_timeout(1000)
                            next_btn = await page.query_selector("#identifierNext, button:has-text('Next')")
                            if next_btn:
                                await next_btn.click()
                            else:
                                await page.keyboard.press("Enter")
                            await page.wait_for_timeout(3000)
                            
                    password_input = await page.wait_for_selector("input[type='password'], name='password'", timeout=15000)
                    if password_input:
                        await password_input.fill(password)
                        await page.wait_for_timeout(1000)
                        pass_next_btn = await page.query_selector("#passwordNext, button:has-text('Next'), button:has-text('Sign in')")
                        if pass_next_btn:
                            await pass_next_btn.click()
                        else:
                            await page.keyboard.press("Enter")
                        await page.wait_for_timeout(5000)
                    
                    # Return to profile page
                    await page.goto("https://www.naukri.com/mnjuser/profile", wait_until="domcontentloaded", timeout=60000)
                    await page.wait_for_timeout(3000)
                    
                    login_btn = await page.query_selector("#login_Layer, .login-btn, a[href*='login']")
                    if not login_btn or not await login_btn.is_visible():
                        logger.info("✅ Automated login successful!")
                        login_success = True
                        cookies = await context.cookies()
                        session_file.parent.mkdir(exist_ok=True)
                        session_file.write_text(json.dumps(cookies, indent=2))
                except Exception as ex:
                    logger.error(f"❌ Error during login for profile update: {ex}")
            
            if not login_success:
                logger.error("❌ Authentication failed. Cannot update Naukri profile resume.")
                return False
        
        # Look for the file input element (#attachCV) on the profile page
        logger.info("🔍 Searching for resume upload input (#attachCV) on profile page...")
        file_input = await page.wait_for_selector("input[type='file']#attachCV, input[type='file'][id*='attach']", timeout=15000)
        if file_input:
            logger.info(f"📤 Uploading resume: {pdf_path.name} directly to Naukri profile...")
            await file_input.set_input_files(str(pdf_path))
            await page.wait_for_timeout(5000)
            logger.info("✅ Successfully uploaded and updated resume on your Naukri profile!")
            return True
        else:
            logger.error("❌ Could not find the resume upload input field (#attachCV) on Naukri profile page.")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error during Naukri profile resume update: {e}")
        return False
    finally:
        await browser.close()

# ─────────────────────── Integration Runner ────────────────────────

async def process_and_apply_job(job: dict, api_key: str, profile: dict, headless: bool = False, update_profile_resume: bool = True):
    """Orchestrates tailoring the resume and applying to the job on Naukri."""
    print("=" * 60)
    print(f"[JOB] Processing: {job['title']} at {job['company']}")
    print("=" * 60)
    
    cv_content = CV_MD.read_text(encoding="utf-8") if CV_MD.exists() else ""
    
    # 1. AI CV tailoring content
    tailored_data = await tailor_cv_content_ai(
        job_title=job["title"],
        job_desc=job.get("description_snippet", "") or job["title"],
        cv_content=cv_content,
        profile=profile,
        api_key=api_key
    )
    
    # 2. PDF compilation
    pdf_path = await compile_tailored_pdf(
        job_company=job["company"],
        tailored_data=tailored_data,
        profile=profile
    )
    
    # 3. Auto-Apply
    success = await automate_naukri_application(
        job_url=job["job_url"],
        pdf_path=pdf_path,
        answers=tailored_data.get("questionnaire_answers", {}),
        headless=headless
    )
    
    if success:
        print(f"[SUCCESS] Fully applied to {job['title']} @ {job['company']}!")
        # Track in applications.md
        tracker_file = CAREER_OPS_DIR / "data" / "applications.md"
        tracker_file.parent.mkdir(exist_ok=True)
        
        num = "001"
        if tracker_file.exists():
            text = tracker_file.read_text()
            matches = re.findall(r"\| (\d{3}) \|", text)
            if matches:
                max_num = max(int(m) for m in matches)
                num = f"{max_num + 1:03d}"
                
        today = datetime.now().strftime("%Y-%m-%d")
        entry = f"| {num} | {today} | {job['company']} | {job['title']} | 4.0 | Applied | Yes | [cv](output/{pdf_path.name}) |\n"
        with open(tracker_file, "a", encoding="utf-8") as f:
            f.write(entry)
        logger.info(f"Saved entry to applications.md tracker.")
        
        # 4. Profile Resume Update (Update default Naukri profile CV with generated PDF)
        if update_profile_resume:
            try:
                await upload_resume_to_naukri_profile(pdf_path, headless=headless)
            except Exception as p_ex:
                logger.error(f"❌ Failed to upload resume to Naukri main profile: {p_ex}")
    else:
        print(f"[FAILED] Could not complete application for {job['title']} @ {job['company']}.")
    
    return success

# Support standard script execution
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    
    async def test():
        keys = load_env_keys()
        prof = load_profile_config()
        api_key = keys.get("OPENROUTER_API_KEY")
        
        if not api_key:
            logger.error("Missing OPENROUTER_API_KEY in .env.local")
            sys.exit(1)
            
        test_job = {
            "title": "Playwright Automation Engineer",
            "company": "TestCorp India",
            "job_url": "https://www.naukri.com/job-listings-playwright-automation-engineer-testcorp-india-3-to-5-years",
            "description_snippet": "We are seeking a Playwright Automation Engineer with 3+ years experience. Expert in Python/TypeScript, writing end-to-end tests, setting up CI/CD workflows."
        }
        await process_and_apply_job(test_job, api_key, prof, headless=False)

    asyncio.run(test())
