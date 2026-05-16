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
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional

from cloakbrowser import launch_async

logger = logging.getLogger(__name__)


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
        self.username = os.environ.get("NAUKRI_USERNAME")
        self.password = os.environ.get("NAUKRI_PASSWORD")
        self.is_logged_in = False

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
        if location_slug:
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

    async def _login(self, page):
        """Attempts to login to Naukri if credentials are provided."""
        if not self.username or not self.password:
            logger.info("ℹ️  No Naukri credentials provided. Proceeding as guest.")
            return False

        if self.is_logged_in:
            return True

        logger.info(f"🔐 Attempting Naukri login for: {self.username}")
        try:
            await page.goto(f"{self.BASE_URL}/nlogin/login", wait_until="networkidle", timeout=self.timeout)
            
            # Fill username/password
            await page.fill("#usernameField", self.username)
            await page.fill("#passwordField", self.password)
            
            # Click Login
            await page.click("button[type='submit']")
            
            # Wait for redirection to dashboard or home
            await page.wait_for_load_state("networkidle")
            
            # Verify login by checking for user profile or logout button
            try:
                await page.wait_for_selector(".nI-g_profile, a[href*='logout']", timeout=15000)
                logger.info("✅ Naukri Login SUCCESSFUL!")
                self.is_logged_in = True
                return True
            except Exception:
                logger.warning("⚠️  Login might have failed or encountered a captcha. Proceeding as guest.")
                return False
                
        except Exception as e:
            logger.error(f"❌ Login Error: {e}")
            return False

    async def _dismiss_popups(self, page):
        popup_selectors = [
            "button[data-dismiss='modal']",
            ".modal-close",
            "[aria-label='Close']",
            ".close-btn",
            "#login-layer .login-close",
            ".popupContainer .close",
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
            title_el = await card.query_selector("a.title")
            if not title_el:
                title_el = await card.query_selector(".jobTuple-title a")
            if not title_el:
                title_el = await card.query_selector("[class*='title'] a")

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
                job_id = f"{title[:20]}_{int(time.time())}"

            company = ""
            for sel in [".comp-name", "a.comp-name", "[class*='company'] a"]:
                el = await card.query_selector(sel)
                if el:
                    company = (await el.inner_text()).strip()
                    if company:
                        break

            experience = ""
            for sel in [".expwdth", "[class*='experience']", ".exp span"]:
                el = await card.query_selector(sel)
                if el:
                    experience = (await el.inner_text()).strip()
                    if experience:
                        break

            salary = ""
            for sel in [".salary", "[class*='salary']", ".sal span"]:
                el = await card.query_selector(sel)
                if el:
                    salary = (await el.inner_text()).strip()
                    if salary:
                        break
            if not salary:
                salary = "Not Disclosed"

            location = ""
            for sel in [".locWdth", "[class*='location']", ".location span"]:
                el = await card.query_selector(sel)
                if el:
                    location = (await el.inner_text()).strip()
                    if location:
                        break

            skills = []
            skill_els = await card.query_selector_all(
                ".tags li, [class*='skill'] li, .skillsList li"
            )
            for sk in skill_els[:8]:
                txt = (await sk.inner_text()).strip()
                if txt:
                    skills.append(txt)

            snippet = ""
            for sel in [".job-description", ".jobDesc", "[class*='description']"]:
                el = await card.query_selector(sel)
                if el:
                    snippet = (await el.inner_text()).strip()[:300]
                    if snippet:
                        break

            posted = ""
            for sel in [".job-post-day", "[class*='date']", ".freshness"]:
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
            await page.wait_for_timeout(2000)
            await self._dismiss_popups(page)

            try:
                await page.wait_for_selector(
                    ".jobTupleHeader, .cust-job-tuple, article.jobTuple, [class*='job-tuple'], .srp-jobtuple-wrapper",
                    timeout=20000,
                )
            except Exception:
                title = await page.title()
                logger.warning(f"No job cards found on: {url} (Page Title: '{title}')")
                # Diagnostic: check if we are blocked
                if "Access Denied" in title or "Cloudflare" in title:
                    logger.error("🛑 Bot detection triggered (Access Denied / Cloudflare)")
                return []

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

            logger.info(f"Found {len(cards)} job cards")
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
            
            browser = await launch_async(
                headless=self.headless,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--window-size=1920,1080",
                ],
            )

            try:
                context = await browser.new_context(
                    viewport={"width": 1920, "height": 1080},
                    locale="en-IN",
                    timezone_id="Asia/Kolkata",
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
                )
                page = await context.new_page()

                # Attempt Login Once per launch
                if attempt == 1 and not self.is_logged_in:
                    await self._login(page)

                for page_num in range(1, self.max_pages + 1):
                    url = self._build_search_url(query, page_num)
                    jobs = await self._scrape_search_page(page, url)
                    if not jobs:
                        break
                    all_jobs.extend(jobs)
                    if page_num < self.max_pages:
                        await asyncio.sleep(self.delay_between_pages)
                
                # If we found jobs on any attempt, we can stop retrying for this query
                if all_jobs:
                    break
                    
            finally:
                await browser.close()
            
            if attempt < max_retries:
                wait_time = random.randint(5, 15)
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
