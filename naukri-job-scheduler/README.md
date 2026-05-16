# 🔍 Naukri Job Scheduler

**Automated Naukri.com job scraper + email digest — runs free on GitHub Actions.**

Scrapes jobs 3× per day on weekdays, deduplicates results, and sends you a beautiful HTML email with all new listings. Inspired by [career-ops](https://github.com/santifer/career-ops).

---

## ✨ Features

- 🤖 **Playwright scraper** — renders JavaScript, handles dynamic content
- 📧 **HTML email digest** — company chips, skill tags, apply links
- 🔁 **Smart deduplication** — never see the same job twice (cached across runs)
- 🔍 **Multiple search queries** — different roles, cities, experience levels
- 🎯 **Keyword filters** — title include/exclude, company blacklist
- ⏰ **3× daily schedule** — 9 AM, 1 PM, 6 PM IST (Mon–Fri)
- 🆓 **100% free** — runs entirely on GitHub Actions free tier

---

## 🚀 Setup (5 minutes)

### 1. Fork / clone this repo

```bash
git clone https://github.com/YOUR_USERNAME/naukri-job-scheduler.git
cd naukri-job-scheduler
```

### 2. Configure your search

Edit `config/config.yml`:

```yaml
profile:
  name: "Rahul"
  target_role: "Python Backend Engineer"

search_queries:
  - keyword: "python developer"
    location: "bangalore"
    experience_years: 3
    enabled: true
    filters:
      title_include: ["python", "backend", "engineer"]
      title_exclude: ["sales", "intern"]
      company_exclude: []

email:
  recipients:
    - "your-email@gmail.com"
```

### 3. Set GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value |
|---|---|
| `EMAIL_SENDER` | Your Gmail: `you@gmail.com` |
| `EMAIL_PASSWORD` | Gmail [App Password](https://myaccount.google.com/apppasswords) (16 chars) |
| `EMAIL_RECIPIENTS` | `you@gmail.com,spouse@gmail.com` |

> ⚠️ **App Password ≠ Gmail password.** Go to Google Account → Security → 2-Step Verification → App Passwords → Generate one for "Mail".

### 4. Enable GitHub Actions

Go to **Actions tab** → click **"I understand my workflows, go ahead and enable them"**

### 5. Test manually

Go to **Actions → Naukri Job Scheduler → Run workflow** → click **Run workflow**

Check your inbox within ~3 minutes. ✅

---

## 📁 Project Structure

```
naukri-job-scheduler/
├── .github/
│   └── workflows/
│       └── naukri_scheduler.yml    # GitHub Actions (schedule + manual trigger)
├── src/
│   ├── naukri_scraper.py           # Playwright scraper
│   └── email_sender.py             # HTML email builder + SMTP sender
├── config/
│   └── config.yml                  # YOUR CONFIGURATION FILE
├── data/
│   ├── seen_job_ids.json           # Dedup cache (managed by GH Actions cache)
│   └── results/                    # JSON output per run (uploaded as artifact)
├── logs/                           # Run logs (uploaded as artifact)
├── main.py                         # Orchestrator
└── requirements.txt
```

---

## ⚙️ Customization

### Add more search queries

```yaml
search_queries:
  - keyword: "data engineer"
    location: "hyderabad"
    experience_years: 4
    enabled: true
    filters:
      title_include: ["data", "engineer", "pipeline"]
      title_exclude: ["sales"]
      company_exclude: ["Some BPO Ltd"]
```

### Change schedule

Edit `.github/workflows/naukri_scheduler.yml`:

```yaml
schedule:
  - cron: "30 3 * * 1-5"   # 9 AM IST, weekdays
  - cron: "30 7 * * 1-5"   # 1 PM IST, weekdays
  - cron: "30 12 * * 1-5"  # 6 PM IST, weekdays
```

> IST = UTC + 5:30, so subtract 5:30 from your desired IST time for the cron UTC time.

### Scraper tuning

```yaml
scraper:
  max_pages: 5          # More pages = more jobs but slower
  slow_mo: 1000         # Increase if getting blocked
  delay_between_pages: 4
```

---

## 📧 Email Preview

The digest email includes:
- Total new jobs count
- Top companies summary
- Per-job card: title, company, location, experience, salary, skills, apply button
- Direct "View & Apply" links to Naukri

---

## 🔒 Privacy & ToS

- Your credentials stay in GitHub Secrets — never in code
- Runs are private to your repository
- Use responsibly and in accordance with Naukri's Terms of Service
- This tool is for personal job search assistance only

---

## 🛠️ Troubleshooting

| Issue | Fix |
|---|---|
| Email not arriving | Check spam folder; verify App Password is correct |
| No jobs found | Naukri may have changed HTML structure; open an issue |
| `SMTP auth failed` | You need a Gmail **App Password**, not your Gmail password |
| Workflow not running | Go to Actions tab and enable workflows |
| Too many jobs | Add more `title_exclude` or `company_exclude` filters |

---

Inspired by [santifer/career-ops](https://github.com/santifer/career-ops) — the AI-powered job search system. 🚀
