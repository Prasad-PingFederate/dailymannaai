"""
Naukri Job Scheduler — Main Entry Point
Orchestrates scraping and email delivery
"""

import asyncio
import json
import logging
import sys
from datetime import datetime
from pathlib import Path

import yaml

from src.naukri_scraper import NaukriScraper
from src.email_sender import EmailSender

# ─────────────────────── Logging Setup ───────────────────────────

def setup_logging(level: str = "INFO"):
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    log_file = log_dir / f"naukri_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(log_file, encoding="utf-8"),
        ],
    )
    return logging.getLogger("main")


# ─────────────────────── Config ───────────────────────────────────

def load_config(path: str = "config/config.yml") -> dict:
    cfg_path = Path(path)
    if not cfg_path.exists():
        raise FileNotFoundError(f"Config file not found: {cfg_path.resolve()}")
    with open(cfg_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


# ─────────────────────── Job Saving ──────────────────────────────

def save_jobs_json(jobs, output_dir: str = "data/results"):
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    filename = f"{output_dir}/jobs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    data = {
        "fetched_at": datetime.now().isoformat(),
        "count": len(jobs),
        "jobs": [j.to_dict() for j in jobs],
    }
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    return filename


# ─────────────────────── Main ────────────────────────────────────

async def main():
    logger = setup_logging()
    logger.info("=" * 60)
    logger.info("🚀 Naukri Job Scheduler starting")
    logger.info(f"⏰ Run time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S IST')}")
    logger.info("=" * 60)

    # Load config
    try:
        config = load_config()
        logger.info(f"✅ Config loaded. Queries: {len(config.get('search_queries', []))}")
    except FileNotFoundError as e:
        logger.error(str(e))
        sys.exit(1)

    # Scrape
    scraper = NaukriScraper(config)
    logger.info("🔍 Starting Naukri scrape...")
    jobs = await scraper.scrape_all()
    logger.info(f"📦 Total new jobs found: {len(jobs)}")

    if jobs:
        # Save to JSON
        saved = save_jobs_json(jobs)
        logger.info(f"💾 Jobs saved to {saved}")

        # Print summary
        logger.info("\n📋 Job Summary:")
        for i, job in enumerate(jobs[:10], 1):
            logger.info(f"  [{i}] {job.title} @ {job.company} ({job.location})")
        if len(jobs) > 10:
            logger.info(f"  ... and {len(jobs) - 10} more")
    else:
        logger.info("ℹ️  No new jobs found in this run (all already seen or filtered)")

    # Send email
    notify_cfg = config.get("notifications", {})
    if notify_cfg.get("email_enabled", True):
        if not jobs and not notify_cfg.get("send_empty_digest", False):
            logger.info("📧 Skipping email — no new jobs and send_empty_digest=false")
        else:
            logger.info("📧 Sending email digest...")
            try:
                sender = EmailSender(config)
                success = sender.send(jobs)
                if success:
                    logger.info("✅ Email digest sent successfully!")
                else:
                    logger.error("❌ Email sending failed")
                    sys.exit(1)
            except ValueError as e:
                logger.error(f"Email config error: {e}")
                sys.exit(1)
    else:
        logger.info("📧 Email notifications disabled in config")

    logger.info("✅ Naukri Job Scheduler completed successfully")


if __name__ == "__main__":
    asyncio.run(main())
