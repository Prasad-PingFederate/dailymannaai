"""
Email Sender for Naukri Job Digest
Sends formatted HTML email with all new jobs found
"""

import logging
import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List

from src.naukri_scraper import Job

logger = logging.getLogger(__name__)


# ─────────────────────── HTML Template ───────────────────────────

def _render_job_card(job: Job, index: int) -> str:
    skills_html = ""
    if job.skills:
        chips = "".join(
            f'<span style="display:inline-block;background:#e8f4fd;color:#1a73e8;'
            f"border-radius:12px;padding:2px 10px;font-size:12px;"
            f'margin:2px 2px 2px 0;">{s}</span>'
            for s in job.skills[:6]
        )
        skills_html = f'<div style="margin-top:8px;">{chips}</div>'

    salary_html = ""
    if job.salary and job.salary != "Not Disclosed":
        salary_html = (
            f'<span style="color:#2e7d32;font-weight:600;">💰 {job.salary}</span>'
            f'<span style="color:#ccc;margin:0 8px;">|</span>'
        )

    snippet_html = ""
    if job.description_snippet:
        snippet_html = (
            f'<p style="color:#666;font-size:13px;margin:8px 0 0;'
            f'line-height:1.5;border-left:3px solid #e0e0e0;padding-left:10px;">'
            f"{job.description_snippet[:250]}...</p>"
        )

    posted_badge = ""
    if job.posted_date:
        # Color based on freshness
        color = "#4caf50" if "day" in job.posted_date.lower() or "hour" in job.posted_date.lower() else "#ff9800"
        posted_badge = (
            f'<span style="background:{color};color:white;border-radius:10px;'
            f'padding:1px 8px;font-size:11px;margin-left:8px;">{job.posted_date}</span>'
        )

    return f"""
    <div style="background:white;border:1px solid #e0e0e0;border-radius:10px;
                padding:20px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div style="flex:1;">
          <h3 style="margin:0 0 4px;font-size:17px;color:#1a1a2e;">
            <a href="{job.job_url}" style="color:#1a73e8;text-decoration:none;"
               target="_blank">{job.title}</a>
            {posted_badge}
          </h3>
          <div style="color:#444;font-size:14px;margin-bottom:6px;font-weight:500;">
            🏢 {job.company}
          </div>
          <div style="color:#555;font-size:13px;line-height:1.8;">
            📍 {job.location or 'N/A'} &nbsp;|&nbsp;
            🧳 {job.experience or 'N/A'} &nbsp;|&nbsp;
            {salary_html}
          </div>
          {skills_html}
          {snippet_html}
        </div>
      </div>
      <div style="margin-top:14px;">
        <a href="{job.job_url}"
           style="background:#1a73e8;color:white;padding:8px 20px;border-radius:6px;
                  text-decoration:none;font-size:13px;font-weight:600;display:inline-block;">
          View & Apply →
        </a>
      </div>
    </div>
    """


def build_email_html(jobs: List[Job], config: dict) -> str:
    profile = config.get("profile", {})
    name = profile.get("name", "Job Seeker")
    role = profile.get("target_role", "your target role")
    now = datetime.now().strftime("%A, %B %d %Y · %I:%M %p IST")
    count = len(jobs)

    # Group by query keyword for better readability
    job_cards = "\n".join(_render_job_card(job, i) for i, job in enumerate(jobs, 1))

    summary_items = ""
    seen_sources = {}
    for job in jobs:
        key = job.company
        seen_sources[key] = seen_sources.get(key, 0) + 1

    top_companies = sorted(seen_sources.items(), key=lambda x: -x[1])[:5]
    for company, cnt in top_companies:
        summary_items += (
            f'<li style="padding:4px 0;color:#444;">'
            f'<strong>{company}</strong> — {cnt} opening{"s" if cnt > 1 else ""}</li>'
        )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Naukri Job Digest</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:680px;margin:24px auto;padding:0 12px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a73e8 0%,#0d47a1 100%);
                border-radius:14px 14px 0 0;padding:32px 28px;color:white;">
      <div style="font-size:13px;opacity:0.85;margin-bottom:6px;">🕐 {now}</div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;">
        Naukri Job Digest
      </h1>
      <p style="margin:0;opacity:0.9;font-size:15px;">
        Hey {name} 👋 — <strong>{count} new job{"s" if count != 1 else ""}</strong>
        matching your search for <em>{role}</em>
      </p>
    </div>

    <!-- Stats Bar -->
    <div style="background:#fff;border-left:1px solid #e0e0e0;border-right:1px solid #e0e0e0;
                padding:16px 28px;display:flex;gap:24px;flex-wrap:wrap;">
      <div style="text-align:center;">
        <div style="font-size:28px;font-weight:700;color:#1a73e8;">{count}</div>
        <div style="font-size:12px;color:#888;">New Jobs</div>
      </div>
      <div style="flex:1;padding-left:24px;border-left:1px solid #f0f0f0;">
        <div style="font-size:12px;color:#888;margin-bottom:6px;">TOP COMPANIES</div>
        <ul style="margin:0;padding:0;list-style:none;">
          {summary_items}
        </ul>
      </div>
    </div>

    <!-- Job Listings -->
    <div style="background:#f5f7fa;border:1px solid #e0e0e0;
                border-top:none;padding:20px;border-radius:0 0 14px 14px;">
      <h2 style="margin:0 0 16px;font-size:16px;color:#333;font-weight:600;">
        📋 Job Listings
      </h2>
      {job_cards}

      <!-- Footer -->
      <div style="text-align:center;margin-top:24px;padding-top:20px;
                  border-top:1px solid #e0e0e0;color:#888;font-size:12px;">
        <p style="margin:0 0 8px;">
          This digest was generated automatically by your
          <strong>Naukri Job Scheduler</strong> running on GitHub Actions.
        </p>
        <p style="margin:0;">
          Inspired by
          <a href="https://github.com/santifer/career-ops" style="color:#1a73e8;">
            career-ops
          </a>
          · Built to help your job change 🚀
        </p>
      </div>
    </div>

  </div>
</body>
</html>"""


def build_plain_text(jobs: List[Job], config: dict) -> str:
    profile = config.get("profile", {})
    name = profile.get("name", "Job Seeker")
    now = datetime.now().strftime("%Y-%m-%d %H:%M IST")
    lines = [
        f"NAUKRI JOB DIGEST — {now}",
        f"Hey {name}! Found {len(jobs)} new jobs.\n",
        "=" * 60,
    ]
    for i, job in enumerate(jobs, 1):
        lines.append(f"\n[{i}] {job.title}")
        lines.append(f"    Company   : {job.company}")
        lines.append(f"    Location  : {job.location}")
        lines.append(f"    Experience: {job.experience}")
        lines.append(f"    Salary    : {job.salary}")
        if job.skills:
            lines.append(f"    Skills    : {', '.join(job.skills[:5])}")
        lines.append(f"    Posted    : {job.posted_date}")
        lines.append(f"    Apply     : {job.job_url}")
        lines.append("-" * 60)
    return "\n".join(lines)


# ─────────────────────── Sender ───────────────────────────────────

class EmailSender:
    def __init__(self, config: dict):
        self.config = config
        email_cfg = config.get("email", {})

        self.smtp_host = email_cfg.get("smtp_host", "smtp.gmail.com")
        self.smtp_port = email_cfg.get("smtp_port", 587)
        
        sender_raw = email_cfg.get("sender_email") or os.environ.get("EMAIL_SENDER")
        self.sender_email = sender_raw.strip().replace("\n", "").replace("\r", "") if sender_raw else None
        
        password_raw = email_cfg.get("sender_password") or os.environ.get("EMAIL_PASSWORD")
        self.sender_password = password_raw.strip().replace("\n", "").replace("\r", "") if password_raw else None

        self.recipients = email_cfg.get("recipients", [])
        if isinstance(self.recipients, str):
            # Normalize newlines and semicolons to commas, then split
            normalized = self.recipients.replace("\r", "").replace("\n", ",").replace(";", ",")
            self.recipients = [r.strip() for r in normalized.split(",") if r.strip()]
        elif isinstance(self.recipients, list):
            cleaned = []
            for item in self.recipients:
                if isinstance(item, str):
                    normalized = item.replace("\r", "").replace("\n", ",").replace(";", ",")
                    cleaned.extend([r.strip() for r in normalized.split(",") if r.strip()])
            self.recipients = cleaned

        # Allow env override for recipients
        env_recipients = os.environ.get("EMAIL_RECIPIENTS", "")
        if env_recipients:
            normalized = env_recipients.replace("\r", "").replace("\n", ",").replace(";", ",")
            self.recipients = [r.strip() for r in normalized.split(",") if r.strip()]

        if not self.sender_email:
            raise ValueError("sender_email not configured (set EMAIL_SENDER env var or config)")
        if not self.sender_password:
            raise ValueError("sender_password not configured (set EMAIL_PASSWORD env var or config)")
        if not self.recipients:
            raise ValueError("No recipients configured")

    def send(self, jobs: List[Job]) -> bool:
        """Build and send the job digest email."""
        send_empty_digest = self.config.get("notifications", {}).get("send_empty_digest", False)
        force_send = os.environ.get("FORCE_SEND", "false").lower() == "true"
        if not jobs and not (send_empty_digest or force_send):
            logger.info("No new jobs to send.")
            return True

        count = len(jobs)
        now_str = datetime.now().strftime("%d %b %Y")
        subject = (
            f"🚀 {count} New Job{'s' if count != 1 else ''} on Naukri — {now_str}"
        )

        # Clean header values of any possible newlines to prevent SMTP injection and folding errors
        clean_sender = str(self.sender_email).replace("\n", "").replace("\r", "").strip()
        clean_recipients = ", ".join(self.recipients).replace("\n", "").replace("\r", "").strip()
        clean_subject = str(subject).replace("\n", "").replace("\r", "").strip()

        msg = MIMEMultipart("alternative")
        msg["Subject"] = clean_subject
        msg["From"] = f"Naukri Job Scheduler <{clean_sender}>"
        msg["To"] = clean_recipients

        plain = build_plain_text(jobs, self.config)
        html = build_email_html(jobs, self.config)

        msg.attach(MIMEText(plain, "plain"))
        msg.attach(MIMEText(html, "html"))

        try:
            logger.info(f"Connecting to {self.smtp_host}:{self.smtp_port}")
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, self.recipients, msg.as_string())
                logger.info(f"✅ Email sent to {', '.join(self.recipients)}")
            return True
        except smtplib.SMTPAuthenticationError:
            logger.error(
                "SMTP auth failed. For Gmail, use an App Password, not your account password. "
                "See: https://myaccount.google.com/apppasswords"
            )
            return False
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
