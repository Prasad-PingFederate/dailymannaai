"""
Naukri Job Scraper using CloakBrowser (Stealth Chromium)
Passes all bot detection tests including Cloudflare, reCAPTCHA v3
Drop-in Playwright replacement — same API, stealth C++ patches
"""

import asyncio
import json
import logging
import re
import time
import random
import os
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional

logger = logging.getLogger("src.naukri_scraper")

# Rotate through realistic user agents to reduce fingerprinting
_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
]


async def launch_stealth_browser(headless=True, args=None):
    """
    Launches browser. Bypasses CloakBrowser in CI environments (GitHub Actions)
    to prevent OS-level segmentation faults, falling back to standard Playwright Chromium.
    """
    is_ci = os.environ.get("GITHUB_ACTIONS") == "true"
    
    if not is_ci:
        try:
            from cloakbrowser import launch_async as cloak_launch
            logger.info("🚀 Launching stealth browser with CloakBrowser...")
            return await cloak_launch(headless=headless, args=args)
        except Exception as e:
            logger.warning(f"⚠️ CloakBrowser launch failed ({e}). Falling back to standard Playwright Chromium...")

    logger.info("🎭 Launching standard Playwright Chromium (CI/Fallback mode)...")
    from playwright.async_api import async_playwright
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(
        headless=headless,
        args=args or ["--no-sandbox", "--disable-setuid-sandbox"]
    )
    
    # Monkey patch browser.close to also stop the playwright driver cleanly
    original_close = browser.close
    async def close_with_playwright():
        try:
            await original_close()
        finally:
            await playwright.stop()
    browser.close = close_with_playwright
    return browser


@dataclass
class Job:
    title: str
    company: str
    location: str
    experience: str
    salary: str
    skills: list
    posted_date: str
    job_url: str
    description_snippet: str
    job_id: str
    source: str = "Naukri"
    fetched_at: str = ""

    def __post_init__(self):
        if not self.fetched_at:
            self.fetched_at = datetime.now().isoformat()

    def to_dict(self):
        return asdict(self)


class NaukriScraper:
    BASE_URL = "https://www.naukri.com"

    def __init__(self, config: dict):
        self.config = config
        self.scraper_cfg = config.get("scraper", {})
        self.headless = self.scraper_cfg.get("headless", True)
        self.timeout = self.scraper_cfg.get("timeout", 45000)
        self.max_pages = self.scraper_cfg.get("max_pages", 3)
        self.delay_between_pages = self.scraper_cfg.get("delay_between_pages", 3)
        self.seen_ids_file = Path("data/seen_job_ids.json")
        self.seen_ids_file.parent.mkdir(exist_ok=True)
        self._seen_ids = self._load_seen_ids()
        
        # Credentials from Environment
        import os
        from src.apply_automation import load_env_keys
        env_keys = load_env_keys()
        self.username = (
            os.environ.get("NAUKRI_USERNAME")
            or env_keys.get("NAUKRI_USERNAME")
            or os.environ.get("EMAIL_SENDER")
            or env_keys.get("EMAIL_SENDER")
        )
        self.password = (
            os.environ.get("NAUKRI_PASSWORD")
            or env_keys.get("NAUKRI_PASSWORD")
            or os.environ.get("NAUKARI_PASSWORD")
            or env_keys.get("NAUKARI_PASSWORD")
            or os.environ.get("EMAIL_PASSWORD")
            or env_keys.get("EMAIL_PASSWORD")
        )
        self.is_logged_in = False
        self.session_file = Path("data/naukri_session.json")

    def _load_seen_ids(self) -> set:
        if self.seen_ids_file.exists():
            try:
                return set(json.loads(self.seen_ids_file.read_text()))
            except Exception:
                return set()
        return set()

    def _save_seen_ids(self):
        ids_list = list(self._seen_ids)[-5000:]
        self.seen_ids_file.write_text(json.dumps(ids_list, indent=2))

    def _is_new_job(self, job_id: str) -> bool:
        return job_id not in self._seen_ids

    def _mark_seen(self, job_id: str):
        self._seen_ids.add(job_id)

    def _build_search_url(self, query: dict, page_num: int = 1) -> str:
        keyword = query.get("keyword", "")
        keyword_slug = keyword.replace(" ", "-").lower()
        location = query.get("location", "")
        location_slug = location.replace(" ", "-").lower()
        experience = query.get("experience_years", "")

        # Pattern: naukri.com/keyword-jobs-in-location
        if location_slug and location_slug != "remote":
            base = f"{self.BASE_URL}/{keyword_slug}-jobs-in-{location_slug}"
        else:
            base = f"{self.BASE_URL}/{keyword_slug}-jobs"

        params = []
        # Add explicit search parameters for robustness
        params.append(f"k={keyword}")
        if location:
            params.append(f"l={location}")
        if experience:
            params.append(f"experience={experience}")
        if page_num > 1:
            params.append(f"pageNo={page_num}")

        return f"{base}?{'&'.join(params)}"

    def _cookies_are_valid(self, cookies: list) -> bool:
        """
        Validate session by checking for nauk_at or is_login cookie —
        no page navigation needed, avoids Cloudflare challenge on login page.
        """
        cookie_map = {c["name"]: c["value"] for c in cookies}
        has_token = "nauk_at" in cookie_map and len(cookie_map.get("nauk_at", "")) > 50
        has_login = cookie_map.get("is_login") == "1"
        return has_token or has_login

    async def _load_session_cookies(self, context) -> bool:
        """Loads cookies from file and validates them without a page request."""
        if not self.session_file.exists():
            return False
        try:
            cookies = json.loads(self.session_file.read_text())
            if not self._cookies_are_valid(cookies):
                logger.warning("⚠️ Cached session cookies are expired or invalid.")
                return False
            await context.add_cookies(cookies)
            logger.info("🍪 Valid session cookies loaded from cache — skipping login entirely.")
            self.is_logged_in = True
            return True
        except Exception as e:
            logger.warning(f"⚠️ Failed loading session cookies: {e}")
            return False

    async def _try_direct_login(self, page) -> bool:
        """
        Direct email/password login with multiple selector fallbacks.
        Naukri has changed their login page; we try several known selectors.
        """
        logger.info(f"🔐 Attempting direct Naukri login for: {self.username}")
        try:
            await page.goto(
                f"{self.BASE_URL}/nlogin/login",
                wait_until="domcontentloaded",
                timeout=self.timeout,
            )
            # Brief wait for JS to hydrate
            await page.wait_for_timeout(3000)

            # Try multiple username field selectors
            username_selectors = [
                "#usernameField",
                "input[placeholder*='Email ID']",
                "input[placeholder*='email']",
                "input[type='email']",
                "input[name='username']",
                "input[name='email']",
                ".loginForm input[type='text']",
            ]
            username_input = None
            for sel in username_selectors:
                try:
                    username_input = await page.wait_for_selector(sel, timeout=5000)
                    if username_input:
                        logger.info(f"✅ Found username field via: {sel}")
                        break
                except Exception:
                    continue

            if not username_input:
                logger.error("❌ Could not find username input on login page.")
                return False

            await username_input.fill(self.username)
            await page.wait_for_timeout(random.randint(500, 1200))

            # Password field selectors
            password_selectors = [
                "#passwordField",
                "input[type='password']",
                "input[placeholder*='Password']",
                "input[name='password']",
            ]
            password_input = None
            for sel in password_selectors:
                try:
                    password_input = await page.wait_for_selector(sel, timeout=4000)
                    if password_input:
                        logger.info(f"✅ Found password field via: {sel}")
                        break
                except Exception:
                    continue

            if not password_input:
                logger.error("❌ Could not find password input on login page.")
                return False

            await password_input.fill(self.password)
            await page.wait_for_timeout(random.randint(500, 1000))

            # Submit button selectors
            submit_selectors = [
                "button[type='submit']",
                ".blue-btn",
                "button:has-text('Login')",
                "button:has-text('Sign in')",
                "input[type='submit']",
            ]
            for sel in submit_selectors:
                try:
                    btn = await page.query_selector(sel)
                    if btn and await btn.is_visible():
                        await btn.click()
                        logger.info(f"🖱️ Clicked submit via: {sel}")
                        break
                except Exception:
                    continue

            await page.wait_for_timeout(5000)

            # Validate login success via cookies (no navigation needed)
            cookies = await page.context.cookies()
            if self._cookies_are_valid(cookies):
                logger.info("✅ Direct Naukri login successful!")
                self.is_logged_in = True
                # Cache the refreshed cookies
                self.session_file.parent.mkdir(exist_ok=True)
                self.session_file.write_text(json.dumps(cookies, indent=2))
                return True

            logger.warning("⚠️ Login submitted but session cookies not found — likely captcha or wrong credentials.")
            return False

        except Exception as e:
            logger.error(f"❌ Direct login error: {e}")
            return False

    async def _login(self, page):
        """
        Tries cookie-based auth first, then Google SSO, then direct form login.
        Never navigates to verify cookies — checks cookie names instead (avoids Cloudflare).
        """
        if self.is_logged_in:
            return True

        # 1. Cookie-first: load + validate without page navigation
        if await self._load_session_cookies(page.context):
            return True

        if not self.username or not self.password:
            logger.info("ℹ️ No credentials provided. Proceeding as guest (scraping only).")
            return False

        # 2. Try Google SSO
        logger.info(f"🔐 Attempting Google SSO login fallback for: {self.username}")
        try:
            from src.apply_automation import perform_google_login
            login_success = await perform_google_login(
                page, page.context, self.username, self.password,
                self.session_file, self.BASE_URL, inside_modal=False
            )
            if login_success:
                logger.info("✅ Google SSO login successful in scraper!")
                self.is_logged_in = True
                return True
        except Exception as e:
            logger.warning(f"⚠️ Google SSO login failed in scraper: {e}")

        # 3. Direct email/password fallback
        return await self._try_direct_login(page)

    async def _dismiss_popups(self, page):
        popup_selectors = [
            "button[data-dismiss='modal']",
            ".modal-close",
            "[aria-label='Close']",
            ".close-btn",
            "#login-layer .login-close",
            ".popupContainer .close",
            "button:has-text('✕')",
            "button:has-text('×')",
        ]
        for sel in popup_selectors:
            try:
                btn = await page.query_selector(sel)
                if btn and await btn.is_visible():
                    await btn.click()
                    await page.wait_for_timeout(500)
            except Exception:
                pass

    async def _parse_job_card(self, card) -> Optional[Job]:
        try:
            title_el = None
            for sel in ["a.title", ".jobTuple-title a", "[class*='title'] a", "h2 a", "h3 a"]:
                title_el = await card.query_selector(sel)
                if title_el:
                    break

            title = (await title_el.inner_text()).strip() if title_el else ""
            job_url = await title_el.get_attribute("href") if title_el else ""
            if not title:
                return None

            job_id = ""
            if job_url:
                match = re.search(r"(\d{10,})", job_url)
                if match:
                    job_id = match.group(1)
            if not job_id:
                job_id = await card.get_attribute("data-job-id") or ""
            if not job_id:
                job_id = f"{title[:20]}_{int(time.time())}_{random.randint(100,999)}"

            company = ""
            for sel in [".comp-name", "a.comp-name", "[class*='company'] a", "[class*='company-name']"]:
                el = await card.query_selector(sel)
                if el:
                    company = (await el.inner_text()).strip()
                    if company:
                        break

            experience = ""
            for sel in [".expwdth", "[class*='experience']", ".exp span", "[class*='exp'] li"]:
                el = await card.query_selector(sel)
                if el:
                    experience = (await el.inner_text()).strip()
                    if experience:
                        break

            salary = "Not Disclosed"
            for sel in [".salary", "[class*='salary']", ".sal span", "[class*='salary'] li"]:
                el = await card.query_selector(sel)
                if el:
                    txt = (await el.inner_text()).strip()
                    if txt:
                        salary = txt
                        break

            location = ""
            for sel in [".locWdth", "[class*='location']", ".location span", "[class*='loc'] li"]:
                el = await card.query_selector(sel)
                if el:
                    location = (await el.inner_text()).strip()
                    if location:
                        break

            skills = []
            skill_els = await card.query_selector_all(".tags li, [class*='skill'] li, .skillsList li")
            for sk in skill_els[:8]:
                txt = (await sk.inner_text()).strip()
                if txt:
                    skills.append(txt)

            snippet = ""
            for sel in [".job-description", ".jobDesc", "[class*='description']", ".job-desc"]:
                el = await card.query_selector(sel)
                if el:
                    snippet = (await el.inner_text()).strip()[:300]
                    if snippet:
                        break

            posted = ""
            for sel in [".job-post-day", "[class*='date']", ".freshness", "[class*='posted']"]:
                el = await card.query_selector(sel)
                if el:
                    posted = (await el.inner_text()).strip()
                    if posted:
                        break

            if job_url and not job_url.startswith("http"):
                job_url = self.BASE_URL + job_url

            return Job(
                title=title,
                company=company,
                location=location,
                experience=experience,
                salary=salary,
                skills=skills,
                posted_date=posted,
                job_url=job_url,
                description_snippet=snippet,
                job_id=job_id,
            )

        except Exception as e:
            logger.debug(f"Error parsing card: {e}")
            return None

    async def _scrape_search_page(self, page, url: str) -> list:
        jobs = []
        try:
            logger.info(f"Fetching: {url}")
            await page.goto(url, wait_until="domcontentloaded", timeout=self.timeout)
            # Human-like delay
            await page.wait_for_timeout(random.randint(2000, 4000))
            await self._dismiss_popups(page)

            # Check for bot-detection before waiting
            title = await page.title()
            if "Access Denied" in title or "Cloudflare" in title or "Just a moment" in title:
                logger.error(f"🛑 Bot detection triggered on: {url} (Page Title: '{title}')")
                return []

            try:
                await page.wait_for_selector(
                    ".jobTupleHeader, .cust-job-tuple, article.jobTuple, "
                    "[class*='job-tuple'], .srp-jobtuple-wrapper, [class*='jobTuple']",
                    timeout=20000,
                )
            except Exception:
                logger.warning(f"No job cards found on: {url} (Page Title: '{title}')")
                return []

            # Human-like scrolling
            for _ in range(4):
                await page.mouse.wheel(0, random.randint(400, 900))
                await page.wait_for_timeout(random.randint(700, 1500))

            cards = []
            for sel in [
                "article.jobTuple",
                ".cust-job-tuple",
                ".jobTupleHeader",
                "[class*='job-tuple']",
                ".srp-jobtuple-wrapper",
            ]:
                cards = await page.query_selector_all(sel)
                if cards:
                    break

            logger.info(f"Found {len(cards)} job cards on {url}")
            for card in cards:
                job = await self._parse_job_card(card)
                if job:
                    jobs.append(job)

        except Exception as e:
            logger.error(f"Error scraping {url}: {e}")

        return jobs

    def _apply_filters(self, jobs: list, query: dict) -> list:
        filters = query.get("filters", {})
        title_include = [k.lower() for k in filters.get("title_include", [])]
        title_exclude = [k.lower() for k in filters.get("title_exclude", [])]
        company_exclude = [c.lower() for c in filters.get("company_exclude", [])]

        filtered = []
        for job in jobs:
            title_lower = job.title.lower()
            if title_include and not any(k in title_lower for k in title_include):
                continue
            if any(k in title_lower for k in title_exclude):
                continue
            if any(c in job.company.lower() for c in company_exclude):
                continue
            filtered.append(job)

        return filtered

    async def scrape_query(self, query: dict) -> list:
        all_jobs = []
        new_jobs = []
        max_retries = 3

        for attempt in range(1, max_retries + 1):
            logger.info(f"Scrape attempt {attempt}/{max_retries} for query '{query.get('keyword')}'")

            # Always maximize layout according to user global rules
            browser = await launch_stealth_browser(
                headless=self.headless,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--start-maximized",
                ],
            )

            try:
                context = await browser.new_context(
                    no_viewport=True,
                    locale="en-IN",
                    timezone_id="Asia/Kolkata",
                    user_agent=random.choice(_USER_AGENTS),
                    extra_http_headers={
                        "Accept-Language": "en-IN,en;q=0.9",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                        "sec-ch-ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": '"Windows"',
                    },
                )
                page = await context.new_page()

                # Login once per scraper lifetime (cookie-first, no redundant logins)
                if not self.is_logged_in:
                    await self._login(page)

                for page_num in range(1, self.max_pages + 1):
                    url = self._build_search_url(query, page_num)
                    jobs = await self._scrape_search_page(page, url)
                    if not jobs:
                        break
                    all_jobs.extend(jobs)
                    if page_num < self.max_pages:
                        await asyncio.sleep(self.delay_between_pages + random.uniform(1, 3))

                if all_jobs:
                    break

            finally:
                await browser.close()

            if attempt < max_retries:
                # Exponential backoff: 10s, 20s, 40s
                wait_time = min(10 * (2 ** (attempt - 1)), 60) + random.randint(0, 10)
                logger.info(f"No jobs found on attempt {attempt}. Retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)

        filtered = self._apply_filters(all_jobs, query)

        for job in filtered:
            if self._is_new_job(job.job_id):
                new_jobs.append(job)
                self._mark_seen(job.job_id)

        self._save_seen_ids()
        logger.info(
            f"Query '{query.get('keyword')}': {len(all_jobs)} found, "
            f"{len(filtered)} after filter, {len(new_jobs)} new"
        )
        return new_jobs

    async def scrape_all(self) -> list:
        queries = self.config.get("search_queries", [])
        all_new_jobs = []

        for query in queries:
            if not query.get("enabled", True):
                continue
            jobs = await self.scrape_query(query)
            all_new_jobs.extend(jobs)

        seen = set()
        deduped = []
        for job in all_new_jobs:
            if job.job_id not in seen:
                seen.add(job.job_id)
                deduped.append(job)

        return deduped
