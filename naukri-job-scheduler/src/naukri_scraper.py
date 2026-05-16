"""
Naukri Job Scraper using Playwright
Fetches jobs based on configurable search queries and filters
"""

import asyncio
import json
import logging
import os
import re
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import yaml
from playwright.async_api import async_playwright, Page, Browser, TimeoutError as PlaywrightTimeout

logger = logging.getLogger(__name__)

# ─────────────────────────── Data Model ────────────────────────────

@dataclass
class Job:
    title: str
    company: str
    location: str
    experience: str
    salary: str
    skills: list[str]
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


# ─────────────────────────── Scraper ────────────────────────────

class NaukriScraper:
    BASE_URL = "https://www.naukri.com"
    SEARCH_URL = "https://www.naukri.com/{query}-jobs"

    def __init__(self, config: dict):
        self.config = config
        self.scraper_cfg = config.get("scraper", {})
        self.headless = self.scraper_cfg.get("headless", True)
        self.slow_mo = self.scraper_cfg.get("slow_mo", 500)
        self.timeout = self.scraper_cfg.get("timeout", 30000)
        self.max_pages = self.scraper_cfg.get("max_pages", 3)
        self.delay_between_pages = self.scraper_cfg.get("delay_between_pages", 2)
        self.seen_ids_file = Path("data/seen_job_ids.json")
        self.seen_ids_file.parent.mkdir(exist_ok=True)
        self._seen_ids = self._load_seen_ids()

    def _load_seen_ids(self) -> set:
        if self.seen_ids_file.exists():
            try:
                return set(json.loads(self.seen_ids_file.read_text()))
            except Exception:
                return set()
        return set()

    def _save_seen_ids(self):
        # Keep only last 5000 IDs to avoid unbounded growth
        ids_list = list(self._seen_ids)[-5000:]
        self.seen_ids_file.write_text(json.dumps(ids_list, indent=2))

    def _is_new_job(self, job_id: str) -> bool:
        return job_id not in self._seen_ids

    def _mark_seen(self, job_id: str):
        self._seen_ids.add(job_id)

    async def _setup_browser(self, playwright):
        """Launch browser with anti-bot measures."""
        browser = await playwright.chromium.launch(
            headless=self.headless,
            slow_mo=self.slow_mo,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--disable-infobars",
                "--window-size=1920,1080",
            ],
        )
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            locale="en-IN",
            timezone_id="Asia/Kolkata",
        )
        # Remove webdriver flag
        await context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )
        return browser, context

    async def _safe_text(self, page: Page, selector: str, default: str = "") -> str:
        try:
            el = await page.query_selector(selector)
            if el:
                return (await el.inner_text()).strip()
        except Exception:
            pass
        return default

    async def _safe_attr(self, page: Page, selector: str, attr: str, default: str = "") -> str:
        try:
            el = await page.query_selector(selector)
            if el:
                val = await el.get_attribute(attr)
                return val.strip() if val else default
        except Exception:
            pass
        return default

    async def _dismiss_popups(self, page: Page):
        """Dismiss login/cookie popups if they appear."""
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

    def _build_search_url(self, query: dict, page_num: int = 1) -> str:
        """Build Naukri search URL from query config."""
        keyword = query.get("keyword", "").replace(" ", "-").lower()
        location = query.get("location", "").replace(" ", "-").lower()
        experience = query.get("experience_years", "")

        # Naukri URL format: /keyword-jobs-in-location
        if location:
            base = f"{self.BASE_URL}/{keyword}-jobs-in-{location}"
        else:
            base = f"{self.BASE_URL}/{keyword}-jobs"

        params = []
        if experience:
            params.append(f"experience={experience}")
        if page_num > 1:
            params.append(f"pageNo={page_num}")

        if params:
            return f"{base}?{'&'.join(params)}"
        return base

    async def _parse_job_card(self, page: Page, card) -> Optional[Job]:
        """Parse a single job card element."""
        try:
            # Job title
            title_el = await card.query_selector("a.title")
            if not title_el:
                title_el = await card.query_selector(".jobTuple-title a")
            if not title_el:
                title_el = await card.query_selector("[class*='title'] a")

            title = (await title_el.inner_text()).strip() if title_el else ""
            job_url = await title_el.get_attribute("href") if title_el else ""
            if not title:
                return None

            # Job ID from URL or data attribute
            job_id = ""
            if job_url:
                # Extract ID from URL like /job-listings-xxx-yyy-123456789
                match = re.search(r"(\d{8,})", job_url)
                if match:
                    job_id = match.group(1)
            if not job_id:
                job_id = await card.get_attribute("data-job-id") or ""
            if not job_id:
                job_id = f"{title[:20]}_{int(time.time())}"

            # Company
            company = ""
            for sel in [".comp-name", ".companyInfo .name", "[class*='company'] a", "a.comp-name"]:
                el = await card.query_selector(sel)
                if el:
                    company = (await el.inner_text()).strip()
                    if company:
                        break

            # Experience
            experience = ""
            for sel in [".expwdth", "[class*='experience']", ".exp span"]:
                el = await card.query_selector(sel)
                if el:
                    experience = (await el.inner_text()).strip()
                    if experience:
                        break

            # Salary
            salary = ""
            for sel in [".salary", "[class*='salary']", ".sal span"]:
                el = await card.query_selector(sel)
                if el:
                    salary = (await el.inner_text()).strip()
                    if salary:
                        break
            if not salary:
                salary = "Not Disclosed"

            # Location
            location = ""
            for sel in [".locWdth", "[class*='location']", ".location span"]:
                el = await card.query_selector(sel)
                if el:
                    location = (await el.inner_text()).strip()
                    if location:
                        break

            # Skills
            skills = []
            skill_els = await card.query_selector_all(".tags li, [class*='skill'] li, .skillsList li")
            for sk in skill_els[:8]:
                txt = (await sk.inner_text()).strip()
                if txt:
                    skills.append(txt)

            # Description snippet
            snippet = ""
            for sel in [".job-description", ".jobDesc", "[class*='description']"]:
                el = await card.query_selector(sel)
                if el:
                    snippet = (await el.inner_text()).strip()[:300]
                    if snippet:
                        break

            # Posted date
            posted = ""
            for sel in [".job-post-day", "[class*='date']", ".freshness"]:
                el = await card.query_selector(sel)
                if el:
                    posted = (await el.inner_text()).strip()
                    if posted:
                        break

            # Ensure full URL
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
            logger.debug(f"Error parsing job card: {e}")
            return None

    async def _scrape_search_page(self, page: Page, url: str) -> list[Job]:
        """Scrape a single search results page."""
        jobs = []
        try:
            logger.info(f"Fetching: {url}")
            await page.goto(url, wait_until="domcontentloaded", timeout=self.timeout)
            await page.wait_for_timeout(2000)
            await self._dismiss_popups(page)

            # Wait for job listings
            try:
                await page.wait_for_selector(
                    ".jobTupleHeader, .cust-job-tuple, article.jobTuple, [class*='job-tuple']",
                    timeout=15000,
                )
            except PlaywrightTimeout:
                logger.warning(f"No job cards found on {url}")
                return []

            # Scroll to load lazy content
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
            await page.wait_for_timeout(1000)
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(1000)

            # Find all job cards
            card_selectors = [
                "article.jobTuple",
                ".cust-job-tuple",
                ".jobTupleHeader",
                "[class*='job-tuple']",
                ".srp-jobtuple-wrapper",
            ]
            cards = []
            for sel in card_selectors:
                cards = await page.query_selector_all(sel)
                if cards:
                    break

            logger.info(f"Found {len(cards)} job cards")
            for card in cards:
                job = await self._parse_job_card(page, card)
                if job:
                    jobs.append(job)

        except PlaywrightTimeout:
            logger.error(f"Timeout loading {url}")
        except Exception as e:
            logger.error(f"Error scraping {url}: {e}")

        return jobs

    def _apply_filters(self, jobs: list[Job], query: dict) -> list[Job]:
        """Filter jobs based on config rules."""
        filters = query.get("filters", {})
        title_include = [k.lower() for k in filters.get("title_include", [])]
        title_exclude = [k.lower() for k in filters.get("title_exclude", [])]
        company_exclude = [c.lower() for c in filters.get("company_exclude", [])]
        min_salary = filters.get("min_salary_lpa", 0)

        filtered = []
        for job in jobs:
            title_lower = job.title.lower()

            # Title include filter
            if title_include and not any(k in title_lower for k in title_include):
                continue

            # Title exclude filter
            if any(k in title_lower for k in title_exclude):
                continue

            # Company exclude filter
            if any(c in job.company.lower() for c in company_exclude):
                continue

            filtered.append(job)

        return filtered

    async def scrape_query(self, query: dict) -> list[Job]:
        """Scrape jobs for a single search query."""
        all_jobs = []
        new_jobs = []

        async with async_playwright() as p:
            browser, context = await self._setup_browser(p)
            page = await context.new_page()

            try:
                for page_num in range(1, self.max_pages + 1):
                    url = self._build_search_url(query, page_num)
                    jobs = await self._scrape_search_page(page, url)

                    if not jobs:
                        break

                    all_jobs.extend(jobs)
                    if page_num < self.max_pages:
                        await asyncio.sleep(self.delay_between_pages)

            finally:
                await browser.close()

        # Apply filters
        filtered = self._apply_filters(all_jobs, query)

        # Deduplicate
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

    async def scrape_all(self) -> list[Job]:
        """Scrape all configured search queries."""
        queries = self.config.get("search_queries", [])
        all_new_jobs = []

        for query in queries:
            if not query.get("enabled", True):
                continue
            jobs = await self.scrape_query(query)
            all_new_jobs.extend(jobs)

        # Global dedup by job_id
        seen = set()
        deduped = []
        for job in all_new_jobs:
            if job.job_id not in seen:
                seen.add(job.job_id)
                deduped.append(job)

        return deduped
