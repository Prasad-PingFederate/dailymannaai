# 📝 Naukri Job Scheduler: Architectural Decisions & Suggestion Ledger

This document acts as a persistent record of all suggestions, user requirements, and architectural optimizations implemented to ensure the highest reliability, efficiency, and safety for your automated job search suite.

---

## 🚀 Overview of Implemented Suggestions

### 1. Single Tailored Resume & Single Profile Upload per Run
* **Suggestion:** Instead of generating a new resume and uploading it to Naukri for every single job applied to (which takes massive AI costs and repeatedly edits the profile), generate exactly **one** high-quality tailored resume based on the top/first job in the run and upload it **once** to your profile. All subsequent applies in that run will reuse this precompiled resume.
* **Status:** **Implemented & Fully Pushed ✅**
* **Technical Detail:** Decoupled resume preparation and application dispatching in `src/apply_automation.py`. Updated `main.py` to tailor the CV once, upload it to the profile, and pass the precompiled PDF path to the application queue.

### 2. Polite Random Jitter Delays
* **Suggestion:** While applying to multiple jobs, add delays/waits between each submission to avoid hitting rate limits or triggering bot-detection systems (like Cloudflare).
* **Status:** **Implemented & Fully Pushed ✅**
* **Technical Detail:** Introduced `delay_between_applies: 45` in `config/config.yml`. Added randomized sleep time ($\pm 20\%$, yielding $36 - 54$ seconds) inside `main.py` before each successive job application to perfectly mimic natural human activity.

### 3. Cap Applies to Top 5 Jobs
* **Suggestion:** Restrict automatic applications to only the top 5 scraped matches per scheduled run to ensure maximum quality and profile safety.
* **Status:** **Implemented & Fully Pushed ✅**
* **Technical Detail:** Added `max_applications_per_run: 5` inside `config/config.yml`. The application loop in `main.py` automatically slices the jobs array to respect this threshold.

### 4. Remove Broken Static Google OAuth URL Fallback
* **Suggestion:** Fix the recurring Google Sign-in error: *"The server cannot process the request because it is malformed. It should not be retried. That’s all we know."* to guarantee GitHub Actions passes flawlessly.
* **Status:** **Implemented & Fully Pushed ✅**
* **Technical Detail:** Removed the static, hardcoded accountchooser Google URL which Google's security systems were rejecting. If Google SSO fails or the button is absent, the automation immediately and gracefully falls back to the highly stable direct Naukri email/password login flow.

### 5. Interactive Headed Login & Upload Utility
* **Suggestion:** Support headed browser interaction to manually handle session cookie updates or view the uploads in real time.
* **Status:** **Implemented & Fully Pushed ✅**
* **Technical Detail:** Created [direct_profile_update.py](file:///c:/Users/Infobell/.gemini/antigravity/scratch/dailymannaai/naukri-job-scheduler/direct_profile_update.py) and [test_login.py](file:///c:/Users/Infobell/.gemini/antigravity/scratch/dailymannaai/naukri-job-scheduler/test_login.py) which boot up a headed browser, authenticate securely, and save session parameters back to `data/naukri_session.json` to keep headless runs running smoothly.

---

## 📈 Next Steps & System Health
All parameters and behaviors are fully customizable inside [config/config.yml](file:///c:/Users/Infobell/.gemini/antigravity/scratch/dailymannaai/naukri-job-scheduler/config/config.yml). The GitHub Actions CI pipeline is now completely protected from Google OAuth Bad Request errors, ensuring your scheduled runs remain robust and error-free!
