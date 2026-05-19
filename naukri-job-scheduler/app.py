import os
import sys
import json
import yaml
import subprocess
import threading
import time
import re
from pathlib import Path
from flask import Flask, jsonify, request, send_file, render_template_string

app = Flask(__name__)

# Base paths
SCHEDULER_DIR = Path(__file__).resolve().parent
CONFIG_PATH = SCHEDULER_DIR / "config" / "config.yml"
PROFILE_PATH = SCHEDULER_DIR / "config" / "career-ops" / "profile.yml"
CV_PATH = SCHEDULER_DIR / "config" / "career-ops" / "cv.md"
APPLICATIONS_PATH = SCHEDULER_DIR / "config" / "career-ops" / "data" / "applications.md"
RESULTS_DIR = SCHEDULER_DIR / "data" / "results"
OUTPUT_DIR = SCHEDULER_DIR / "config" / "career-ops" / "output"
LOG_FILE = SCHEDULER_DIR / "logs" / "web_run.log"

# Global state to track background process execution
current_process = None
active_task_name = None
process_lock = threading.Lock()

def ensure_dirs():
    (SCHEDULER_DIR / "logs").mkdir(exist_ok=True)
    (SCHEDULER_DIR / "data").mkdir(exist_ok=True)
    RESULTS_DIR.mkdir(exist_ok=True, parents=True)
    OUTPUT_DIR.mkdir(exist_ok=True, parents=True)
    (SCHEDULER_DIR / "config" / "career-ops" / "data").mkdir(exist_ok=True, parents=True)

ensure_dirs()

def run_process_in_background(cmd, task_name):
    global current_process, active_task_name
    with process_lock:
        if current_process and current_process.poll() is None:
            return False, "Another task is already running."
        
        # Clear or prepare log file
        LOG_FILE.parent.mkdir(exist_ok=True)
        with open(LOG_FILE, "w", encoding="utf-8") as f:
            f.write(f"=== Starting task: {task_name} at {time.strftime('%Y-%m-%d %H:%M:%S')} ===\n")
        
        # Start process
        try:
            # We run python script using sys.executable to ensure we use the same environment
            full_cmd = [sys.executable] + cmd
            
            # Start the process redirected to LOG_FILE
            log_handle = open(LOG_FILE, "a", encoding="utf-8")
            current_process = subprocess.Popen(
                full_cmd,
                stdout=log_handle,
                stderr=log_handle,
                cwd=str(SCHEDULER_DIR),
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
            )
            active_task_name = task_name
            
            # Start a monitoring thread to close log_handle when done
            def monitor():
                current_process.wait()
                log_handle.close()
                with open(LOG_FILE, "a", encoding="utf-8") as f:
                    f.write(f"\n=== Task completed with exit code: {current_process.returncode} ===\n")
            
            threading.Thread(target=monitor, daemon=True).start()
            return True, f"Successfully started task '{task_name}'."
        except Exception as e:
            return False, f"Failed to start task: {str(e)}"

@app.route("/api/status", methods=["GET"])
def get_status():
    global current_process, active_task_name
    is_running = False
    exit_code = None
    
    if current_process:
        poll = current_process.poll()
        if poll is None:
            is_running = True
        else:
            exit_code = poll
            
    # Read latest logs
    log_content = ""
    if LOG_FILE.exists():
        try:
            with open(LOG_FILE, "r", encoding="utf-8", errors="replace") as f:
                # Read last 150 lines
                lines = f.readlines()
                log_content = "".join(lines[-150:])
        except Exception as e:
            log_content = f"Error reading logs: {str(e)}"
            
    # Check if login session exists
    session_file = SCHEDULER_DIR / "data" / "naukri_session.json"
    session_exists = session_file.exists()
    session_time = None
    if session_exists:
        session_time = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(session_file.stat().st_mtime))
        
    return jsonify({
        "running": is_running,
        "active_task": active_task_name if is_running else None,
        "exit_code": exit_code,
        "session_exists": session_exists,
        "session_time": session_time,
        "logs": log_content
    })

@app.route("/api/stop", methods=["POST"])
def stop_task():
    global current_process, active_task_name
    with process_lock:
        if current_process and current_process.poll() is None:
            try:
                if os.name == 'nt':
                    subprocess.call(['taskkill', '/F', '/T', '/PID', str(current_process.pid)])
                else:
                    current_process.terminate()
                active_task_name = None
                return jsonify({"success": True, "message": "Task terminated successfully."})
            except Exception as e:
                return jsonify({"success": False, "message": f"Failed to stop task: {str(e)}"})
        return jsonify({"success": False, "message": "No active task to stop."})

@app.route("/api/run", methods=["POST"])
def run_scheduler():
    success, message = run_process_in_background(["main.py"], "Scrape & Auto Apply")
    return jsonify({"success": success, "message": message})

@app.route("/api/login-test", methods=["POST"])
def run_login():
    # Use test_login.py in headed mode
    success, message = run_process_in_background(["test_login.py"], "Manual Browser Login Check")
    return jsonify({"success": success, "message": message})

@app.route("/api/profile-update", methods=["POST"])
def run_profile_update():
    success, message = run_process_in_background(["direct_profile_update.py"], "Direct Profile Resume Upload")
    return jsonify({"success": success, "message": message})

# Config APIs
@app.route("/api/config", methods=["GET", "POST"])
def handle_config():
    if request.method == "GET":
        if not CONFIG_PATH.exists():
            return jsonify({"error": "Config file not found"}), 404
        try:
            content = CONFIG_PATH.read_text(encoding="utf-8")
            # Parse YAML to return structured config as well as raw text
            parsed = yaml.safe_load(content)
            return jsonify({
                "raw": content,
                "parsed": parsed
            })
        except Exception as e:
            return jsonify({"error": f"Failed to read config: {str(e)}"}), 500
    else:
        # POST
        data = request.json
        if not data or "raw" not in data:
            return jsonify({"error": "Missing raw YAML config content"}), 400
        try:
            # Validate YAML format first
            yaml.safe_load(data["raw"])
            # Save it
            CONFIG_PATH.parent.mkdir(exist_ok=True, parents=True)
            CONFIG_PATH.write_text(data["raw"], encoding="utf-8")
            return jsonify({"success": True, "message": "Config updated successfully!"})
        except Exception as e:
            return jsonify({"error": f"Invalid YAML format: {str(e)}"}), 400

# Profile APIs
@app.route("/api/profile", methods=["GET", "POST"])
def handle_profile():
    if request.method == "GET":
        if not PROFILE_PATH.exists():
            return jsonify({"raw": "", "parsed": {}})
        try:
            content = PROFILE_PATH.read_text(encoding="utf-8")
            parsed = yaml.safe_load(content)
            return jsonify({
                "raw": content,
                "parsed": parsed
            })
        except Exception as e:
            return jsonify({"error": f"Failed to read profile.yml: {str(e)}"}), 500
    else:
        # POST
        data = request.json
        if not data or "raw" not in data:
            return jsonify({"error": "Missing raw profile.yml content"}), 400
        try:
            yaml.safe_load(data["raw"])
            PROFILE_PATH.parent.mkdir(exist_ok=True, parents=True)
            PROFILE_PATH.write_text(data["raw"], encoding="utf-8")
            return jsonify({"success": True, "message": "Profile yml updated successfully!"})
        except Exception as e:
            return jsonify({"error": f"Invalid YAML format: {str(e)}"}), 400

# CV markdown APIs
@app.route("/api/cv", methods=["GET", "POST"])
def handle_cv():
    if request.method == "GET":
        if not CV_PATH.exists():
            return jsonify({"content": ""})
        try:
            content = CV_PATH.read_text(encoding="utf-8")
            return jsonify({"content": content})
        except Exception as e:
            return jsonify({"error": f"Failed to read cv.md: {str(e)}"}), 500
    else:
        # POST
        data = request.json
        if not data or "content" not in data:
            return jsonify({"error": "Missing cv.md markdown content"}), 400
        try:
            CV_PATH.parent.mkdir(exist_ok=True, parents=True)
            CV_PATH.write_text(data["content"], encoding="utf-8")
            return jsonify({"success": True, "message": "cv.md updated successfully!"})
        except Exception as e:
            return jsonify({"error": f"Failed to save cv.md: {str(e)}"}), 500

# Scraped jobs
@app.route("/api/jobs", methods=["GET"])
def get_scraped_jobs():
    if not RESULTS_DIR.exists():
        return jsonify([])
    try:
        # Get all jobs_*.json files
        json_files = list(RESULTS_DIR.glob("jobs_*.json"))
        if not json_files:
            return jsonify([])
            
        # Sort by creation time / name descending
        latest_file = sorted(json_files, key=lambda p: p.stat().st_mtime, reverse=True)[0]
        
        data = json.loads(latest_file.read_text(encoding="utf-8"))
        return jsonify({
            "filename": latest_file.name,
            "fetched_at": data.get("fetched_at"),
            "count": data.get("count", 0),
            "jobs": data.get("jobs", [])
        })
    except Exception as e:
        return jsonify({"error": f"Failed to read scraped jobs: {str(e)}"}), 500

# Parsed applications from applications.md
@app.route("/api/applications", methods=["GET"])
def get_applications():
    if not APPLICATIONS_PATH.exists():
        return jsonify([])
    try:
        lines = APPLICATIONS_PATH.read_text(encoding="utf-8").splitlines()
        applications = []
        
        # Look for table rows: | 001 | 2026-05-19 | Hatica | ...
        for line in lines:
            line = line.strip()
            if not line.startswith("|") or line.startswith("| -") or "Number" in line or "Company" in line:
                continue
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 6:
                # | Number | Date | Company | Title | Match Score | Status | Uploaded | Resume Link |
                # parts: ['001', '2026-05-19', 'Company', 'Title', 'Score', 'Status', 'Uploaded', 'Resume']
                resume_link = parts[7] if len(parts) > 7 else ""
                # Parse resume name from [cv](output/cv-candidate-hatica-2026-05-18.pdf)
                resume_file = ""
                if "output/" in resume_link:
                    match = re.search(r"output/(cv-candidate-[^)]+)", resume_link)
                    if match:
                        resume_file = match.group(1)
                
                applications.append({
                    "number": parts[0],
                    "date": parts[1],
                    "company": parts[2],
                    "title": parts[3],
                    "score": parts[4],
                    "status": parts[5],
                    "uploaded": parts[6] if len(parts) > 6 else "",
                    "resume_file": resume_file
                })
        # Reverse to show latest first
        applications.reverse()
        return jsonify(applications)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to parse applications.md: {str(e)}"}), 500


# Serve latest resume PDF
@app.route("/api/pdf", methods=["GET"])
def get_pdf():
    filename = request.args.get("file")
    if filename:
        pdf_path = OUTPUT_DIR / filename
    else:
        # Find latest pdf in output dir
        pdf_files = list(OUTPUT_DIR.glob("cv-candidate-*.pdf"))
        if not pdf_files:
            return jsonify({"error": "No PDFs found"}), 404
        pdf_path = sorted(pdf_files, key=lambda p: p.stat().st_mtime, reverse=True)[0]
        
    if not pdf_path.exists():
        return jsonify({"error": "PDF file not found"}), 404
        
    return send_file(pdf_path, mimetype="application/pdf")

# Serving the Single Page Application UI
@app.route("/")
def index():
    # We embed the UI template as string inside app.py for ultimate portability!
    return render_template_string(UI_HTML)

UI_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Naukri Job Scheduler — Control Center</title>
    <!-- Google Fonts Outfit & Inter -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <!-- FontAwesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        :root {
            --bg-color: #0b0f19;
            --panel-bg: rgba(17, 24, 39, 0.7);
            --panel-border: rgba(255, 255, 255, 0.08);
            --primary: #4f46e5;
            --primary-glow: rgba(79, 70, 229, 0.4);
            --secondary: #06b6d4;
            --secondary-glow: rgba(6, 182, 212, 0.3);
            --accent: #ec4899;
            --text-main: #f3f4f6;
            --text-muted: #9ca3af;
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: var(--bg-color);
            background-image: 
                radial-gradient(at 10% 10%, rgba(79, 70, 229, 0.15) 0px, transparent 50%),
                radial-gradient(at 90% 80%, rgba(6, 182, 212, 0.12) 0px, transparent 50%),
                radial-gradient(at 50% 50%, rgba(15, 23, 42, 1) 0px, transparent 100%);
            background-attachment: fixed;
            color: var(--text-main);
            font-family: 'Inter', sans-serif;
            min-height: 100vh;
            overflow-x: hidden;
        }

        h1, h2, h3, h4 {
            font-family: 'Outfit', sans-serif;
            font-weight: 600;
            letter-spacing: -0.02em;
        }

        /* Layout Grid */
        .app-container {
            display: flex;
            flex-direction: column;
            max-width: 1440px;
            margin: 0 auto;
            padding: 24px;
            gap: 24px;
        }

        /* Header styling */
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 32px;
            background: var(--panel-bg);
            border: 1px solid var(--panel-border);
            border-radius: 20px;
            backdrop-filter: blur(16px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .header-logo {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .header-logo i {
            font-size: 28px;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 2px 10px var(--primary-glow));
        }

        .header-logo h1 {
            font-size: 22px;
            font-weight: 800;
            background: linear-gradient(to right, #ffffff, #cbd5e1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .header-logo span {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            background: linear-gradient(135deg, var(--secondary), var(--accent));
            color: #fff;
            padding: 2px 8px;
            border-radius: 6px;
            font-weight: 700;
        }

        .system-indicators {
            display: flex;
            gap: 20px;
        }

        .indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 6px 14px;
            border-radius: 30px;
        }

        .indicator .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
        }

        .dot.active {
            background-color: var(--success);
            box-shadow: 0 0 8px var(--success);
        }

        .dot.inactive {
            background-color: var(--danger);
            box-shadow: 0 0 8px var(--danger);
        }

        .dot.warning {
            background-color: var(--warning);
            box-shadow: 0 0 8px var(--warning);
        }

        /* Grid content */
        .dashboard-grid {
            display: grid;
            grid-template-columns: 350px 1fr;
            gap: 24px;
        }

        @media (max-width: 1024px) {
            .dashboard-grid {
                grid-template-columns: 1fr;
            }
        }

        /* Glass Cards */
        .glass-card {
            background: var(--panel-bg);
            border: 1px solid var(--panel-border);
            border-radius: 20px;
            padding: 24px;
            backdrop-filter: blur(16px);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s;
            position: relative;
            overflow: hidden;
        }

        .glass-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, transparent 100%);
            pointer-events: none;
        }

        .glass-card:hover {
            border-color: rgba(255, 255, 255, 0.15);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding-bottom: 12px;
        }

        .card-header h2 {
            font-size: 18px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .card-header h2 i {
            color: var(--secondary);
        }

        /* Sidebar Panels */
        .control-panel {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        /* Buttons styling */
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #fff;
            padding: 12px 20px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            width: 100%;
            font-family: 'Inter', sans-serif;
        }

        .btn:hover {
            background: rgba(255, 255, 255, 0.12);
            transform: translateY(-2px);
        }

        .btn-primary {
            background: linear-gradient(135deg, var(--primary) 0%, #312e81 100%);
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
        }

        .btn-primary:hover {
            background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
            box-shadow: 0 6px 20px rgba(79, 70, 229, 0.5);
        }

        .btn-secondary {
            background: linear-gradient(135deg, var(--secondary) 0%, #0891b2 100%);
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 4px 15px rgba(6, 182, 212, 0.2);
        }

        .btn-secondary:hover {
            background: linear-gradient(135deg, #22d3ee 0%, #0e7490 100%);
            box-shadow: 0 6px 20px rgba(6, 182, 212, 0.4);
        }

        .btn-accent {
            background: linear-gradient(135deg, var(--accent) 0%, #be185d 100%);
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 4px 15px rgba(236, 72, 153, 0.2);
        }

        .btn-accent:hover {
            background: linear-gradient(135deg, #f472b6 0%, #9d174d 100%);
            box-shadow: 0 6px 20px rgba(236, 72, 153, 0.4);
        }

        .btn-danger {
            background: linear-gradient(135deg, var(--danger) 0%, #991b1b 100%);
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2);
        }

        .btn-danger:hover {
            background: linear-gradient(135deg, #f87171 0%, #7f1d1d 100%);
            box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
        }

        /* Tab Layout */
        .tabs {
            display: flex;
            gap: 12px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 6px;
            border-radius: 12px;
            margin-bottom: 20px;
        }

        .tab-btn {
            background: transparent;
            border: none;
            color: var(--text-muted);
            padding: 10px 18px;
            border-radius: 8px;
            font-weight: 500;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .tab-btn:hover {
            color: #fff;
        }

        .tab-btn.active {
            background: rgba(255, 255, 255, 0.08);
            color: #fff;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
            animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Config Editors */
        .editor-container {
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        .editor-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .editor-title h3 {
            font-size: 15px;
            color: var(--text-muted);
        }

        textarea.code-editor {
            width: 100%;
            height: 480px;
            background: #060913;
            border: 1px solid var(--panel-border);
            border-radius: 12px;
            color: #38bdf8;
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            padding: 16px;
            resize: vertical;
            line-height: 1.6;
            outline: none;
        }

        textarea.code-editor:focus {
            border-color: var(--primary);
            box-shadow: 0 0 10px rgba(79, 70, 229, 0.2);
        }

        /* Tables */
        .table-responsive {
            overflow-x: auto;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            background: rgba(0, 0, 0, 0.2);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 13px;
        }

        th {
            background: rgba(255, 255, 255, 0.02);
            padding: 14px 16px;
            font-weight: 600;
            color: var(--text-muted);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.05em;
        }

        td {
            padding: 14px 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            color: var(--text-main);
        }

        tr:last-child td {
            border-bottom: none;
        }

        tr:hover td {
            background: rgba(255, 255, 255, 0.01);
        }

        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .badge-success { background: rgba(16, 185, 129, 0.15); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); }
        .badge-danger { background: rgba(239, 68, 68, 0.15); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2); }
        .badge-warning { background: rgba(245, 158, 11, 0.15); color: var(--warning); border: 1px solid rgba(245, 158, 11, 0.2); }
        .badge-info { background: rgba(6, 182, 212, 0.15); color: var(--secondary); border: 1px solid rgba(6, 182, 212, 0.2); }

        /* Terminal Console */
        .terminal {
            background: #030712;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 16px;
            height: 380px;
            overflow-y: auto;
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            color: #10b981;
            line-height: 1.5;
            box-shadow: inset 0 4px 20px rgba(0,0,0,0.8);
        }

        .terminal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding-bottom: 8px;
            font-size: 11px;
            color: var(--text-muted);
        }

        .terminal-actions {
            display: flex;
            gap: 12px;
        }

        .terminal-actions span {
            cursor: pointer;
        }

        .terminal-actions span:hover {
            color: #fff;
        }

        /* Form elements inside yml parsed dashboard */
        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .form-group label {
            font-size: 12px;
            color: var(--text-muted);
            font-weight: 500;
        }

        .form-group input, .form-group select {
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid var(--panel-border);
            border-radius: 8px;
            padding: 10px 14px;
            color: #fff;
            font-family: 'Inter', sans-serif;
            font-size: 13px;
        }

        .form-group input:focus, .form-group select:focus {
            border-color: var(--secondary);
            outline: none;
        }

        /* Notifications */
        .toast {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: rgba(17, 24, 39, 0.9);
            border: 1px solid var(--primary);
            border-radius: 12px;
            padding: 16px 24px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            z-index: 9999;
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .toast.show {
            transform: translateY(0);
            opacity: 1;
        }

        /* Quick Stats Card */
        .stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            margin-bottom: 20px;
        }

        .stat-card {
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 14px;
            padding: 16px;
            text-align: center;
        }

        .stat-card h3 {
            font-size: 12px;
            color: var(--text-muted);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .stat-card .value {
            font-size: 24px;
            font-weight: 700;
            background: linear-gradient(135deg, #fff, var(--text-muted));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-family: 'Outfit', sans-serif;
        }

        .jobs-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .job-item {
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.04);
            border-radius: 12px;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.2s;
        }

        .job-item:hover {
            border-color: rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.03);
        }

        .job-info h4 {
            font-size: 15px;
            margin-bottom: 4px;
        }

        .job-meta {
            display: flex;
            gap: 16px;
            font-size: 12px;
            color: var(--text-muted);
        }

        .job-meta span {
            display: flex;
            align-items: center;
            gap: 4px;
        }
    </style>
</head>
<body>

    <div class="app-container">
        
        <header>
            <div class="header-logo">
                <i class="fa-solid fa-wand-magic-sparkles"></i>
                <div>
                    <h1>Naukri Job Scheduler</h1>
                    <span id="version-badge">Active Engine</span>
                </div>
            </div>
            <div class="system-indicators">
                <div class="indicator">
                    <span class="dot" id="cookie-dot"></span>
                    <span>Session Cookies: <strong id="cookie-status">Checking...</strong></span>
                </div>
                <div class="indicator">
                    <span class="dot" id="engine-dot"></span>
                    <span>Engine Status: <strong id="engine-status">Idle</strong></span>
                </div>
            </div>
        </header>

        <div class="dashboard-grid">
            
            <!-- Left Sidebar Controls -->
            <div class="control-panel">
                
                <div class="glass-card">
                    <div class="card-header">
                        <h2><i class="fa-solid fa-gears"></i> Execution Center</h2>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <button class="btn btn-primary" id="btn-run-scheduler">
                            <i class="fa-solid fa-play"></i> Run Scraper + Auto Apply
                        </button>
                        <button class="btn btn-secondary" id="btn-run-login">
                            <i class="fa-solid fa-key"></i> Authenticate & Login
                        </button>
                        <button class="btn btn-accent" id="btn-run-profile-update">
                            <i class="fa-solid fa-file-arrow-up"></i> Update Profile Resume
                        </button>
                        <button class="btn btn-danger" id="btn-stop" style="display:none;">
                            <i class="fa-solid fa-stop"></i> Abort Active Task
                        </button>
                    </div>
                </div>

                <div class="glass-card">
                    <div class="card-header">
                        <h2><i class="fa-solid fa-chart-pie"></i> Quick Stats</h2>
                    </div>
                    <div class="stats-row">
                        <div class="stat-card">
                            <h3>Total Applied</h3>
                            <div class="value" id="stat-total-applied">0</div>
                        </div>
                        <div class="stat-card">
                            <h3>Latest Batch</h3>
                            <div class="value" id="stat-latest-batch">0</div>
                        </div>
                    </div>
                    <div style="margin-top: 10px; font-size: 12px; color: var(--text-muted); text-align: center;" id="session-timestamp">
                        Session timestamp: N/A
                    </div>
                </div>

            </div>

            <!-- Right Content Panels -->
            <div class="glass-card">
                
                <div class="tabs">
                    <button class="tab-btn active" data-tab="tab-jobs">
                        <i class="fa-solid fa-list-check"></i> Scraped Jobs
                    </button>
                    <button class="tab-btn" data-tab="tab-applications">
                        <i class="fa-solid fa-history"></i> Applied History
                    </button>
                    <button class="tab-btn" data-tab="tab-config">
                        <i class="fa-solid fa-sliders"></i> Search Config
                    </button>
                    <button class="tab-btn" data-tab="tab-profile">
                        <i class="fa-solid fa-id-card"></i> Candidate Profile
                    </button>
                    <button class="tab-btn" data-tab="tab-cv">
                        <i class="fa-solid fa-file-lines"></i> cv.md Resume
                    </button>
                </div>

                <!-- Tab: Scraped Jobs -->
                <div class="tab-content active" id="tab-jobs">
                    <div class="editor-title" style="margin-bottom: 12px;">
                        <h3>Latest Scraped Matches (Active Batch)</h3>
                        <span id="jobs-filename" style="font-size: 11px; color: var(--text-muted);"></span>
                    </div>
                    <div class="jobs-list" id="scraped-jobs-container">
                        <!-- Loaded dynamically -->
                        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                            <i class="fa-solid fa-circle-nodes fa-spin" style="font-size: 24px; margin-bottom: 10px;"></i>
                            <p>Loading scraped jobs...</p>
                        </div>
                    </div>
                </div>

                <!-- Tab: Applied History -->
                <div class="tab-content" id="tab-applications">
                    <div class="editor-title" style="margin-bottom: 12px;">
                        <h3>Resume Submission Logs (from applications.md)</h3>
                    </div>
                    <div class="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Date</th>
                                    <th>Company</th>
                                    <th>Job Title</th>
                                    <th>Match Score</th>
                                    <th>Status</th>
                                    <th>Resume PDF</th>
                                </tr>
                            </thead>
                            <tbody id="applications-table-body">
                                <!-- Loaded dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Tab: Search Config -->
                <div class="tab-content" id="tab-config">
                    <div class="editor-container">
                        <div class="editor-title">
                            <h3>Edit config.yml</h3>
                            <button class="btn btn-secondary" style="width: auto; padding: 6px 14px; font-size: 12px;" id="btn-save-config">
                                <i class="fa-solid fa-floppy-disk"></i> Save YAML
                            </button>
                        </div>
                        <textarea class="code-editor" id="config-raw"></textarea>
                    </div>
                </div>

                <!-- Tab: Candidate Profile -->
                <div class="tab-content" id="tab-profile">
                    <div class="editor-container">
                        <div class="editor-title">
                            <h3>Edit career-ops/profile.yml</h3>
                            <button class="btn btn-secondary" style="width: auto; padding: 6px 14px; font-size: 12px;" id="btn-save-profile">
                                <i class="fa-solid fa-floppy-disk"></i> Save YAML
                            </button>
                        </div>
                        <textarea class="code-editor" id="profile-raw"></textarea>
                    </div>
                </div>

                <!-- Tab: cv.md Resume -->
                <div class="tab-content" id="tab-cv">
                    <div class="editor-container">
                        <div class="editor-title">
                            <h3>Edit career-ops/cv.md (Base Resume Template)</h3>
                            <button class="btn btn-secondary" style="width: auto; padding: 6px 14px; font-size: 12px;" id="btn-save-cv">
                                <i class="fa-solid fa-floppy-disk"></i> Save Markdown
                            </button>
                        </div>
                        <textarea class="code-editor" id="cv-raw" style="color: #10b981;"></textarea>
                    </div>
                </div>

            </div>

        </div>

        <!-- Terminal Console Drawer -->
        <div class="glass-card" style="margin-top: 10px;">
            <div class="terminal-header">
                <div>
                    <i class="fa-solid fa-terminal" style="color: var(--success); margin-right: 6px;"></i>
                    <span>Real-time Action Log Terminal</span>
                </div>
                <div class="terminal-actions">
                    <span id="btn-clear-logs"><i class="fa-solid fa-trash-can"></i> Clear Terminal</span>
                </div>
            </div>
            <div class="terminal" id="terminal-body">
                Console output will appear here when you run a task...
            </div>
        </div>

    </div>

    <!-- Notification Toast -->
    <div class="toast" id="toast-notify">
        <i class="fa-solid fa-circle-info" style="color: var(--secondary);" id="toast-icon"></i>
        <span id="toast-message">Task updated</span>
    </div>

    <script>
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                const tabId = btn.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });

        // Toast helper
        function showToast(message, isError = false) {
            const toast = document.getElementById('toast-notify');
            const icon = document.getElementById('toast-icon');
            
            icon.className = isError ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check';
            icon.style.color = isError ? 'var(--danger)' : 'var(--success)';
            
            document.getElementById('toast-message').innerText = message;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3500);
        }

        // Fetch configurations
        async function loadConfig() {
            try {
                const res = await fetch('/api/config');
                const data = await res.json();
                document.getElementById('config-raw').value = data.raw;
            } catch(e) {
                console.error("Failed to load config", e);
            }
        }

        async function loadProfile() {
            try {
                const res = await fetch('/api/profile');
                const data = await res.json();
                document.getElementById('profile-raw').value = data.raw;
            } catch(e) {
                console.error("Failed to load profile", e);
            }
        }

        async function loadCV() {
            try {
                const res = await fetch('/api/cv');
                const data = await res.json();
                document.getElementById('cv-raw').value = data.content;
            } catch(e) {
                console.error("Failed to load CV", e);
            }
        }

        // Save handlers
        document.getElementById('btn-save-config').addEventListener('click', async () => {
            const raw = document.getElementById('config-raw').value;
            try {
                const res = await fetch('/api/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ raw })
                });
                const data = await res.json();
                if (data.success) {
                    showToast(data.message);
                } else {
                    showToast(data.error, true);
                }
            } catch(e) {
                showToast("Failed to save config", true);
            }
        });

        document.getElementById('btn-save-profile').addEventListener('click', async () => {
            const raw = document.getElementById('profile-raw').value;
            try {
                const res = await fetch('/api/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ raw })
                });
                const data = await res.json();
                if (data.success) {
                    showToast(data.message);
                } else {
                    showToast(data.error, true);
                }
            } catch(e) {
                showToast("Failed to save profile", true);
            }
        });

        document.getElementById('btn-save-cv').addEventListener('click', async () => {
            const content = document.getElementById('cv-raw').value;
            try {
                const res = await fetch('/api/cv', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content })
                });
                const data = await res.json();
                if (data.success) {
                    showToast(data.message);
                } else {
                    showToast(data.error, true);
                }
            } catch(e) {
                showToast("Failed to save CV", true);
            }
        });

        // Load jobs
        async function loadScrapedJobs() {
            try {
                const res = await fetch('/api/jobs');
                const data = await res.json();
                const container = document.getElementById('scraped-jobs-container');
                
                if (Array.isArray(data) || !data.jobs || data.jobs.length === 0) {
                    container.innerHTML = `
                        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                            <i class="fa-solid fa-folder-open" style="font-size: 24px; margin-bottom: 10px; color: var(--warning);"></i>
                            <p>No scraped jobs found from the latest run.</p>
                        </div>`;
                    document.getElementById('jobs-filename').innerText = "";
                    document.getElementById('stat-latest-batch').innerText = "0";
                    return;
                }
                
                document.getElementById('jobs-filename').innerText = `${data.filename} (${new Date(data.fetched_at).toLocaleDateString()})`;
                document.getElementById('stat-latest-batch').innerText = data.count;
                
                let html = '';
                data.jobs.forEach(job => {
                    html += `
                    <div class="job-item">
                        <div class="job-info">
                            <h4>${job.title}</h4>
                            <div class="job-meta">
                                <span><i class="fa-solid fa-building"></i> ${job.company}</span>
                                <span><i class="fa-solid fa-location-dot"></i> ${job.location}</span>
                                <span><i class="fa-solid fa-briefcase"></i> ${job.experience}</span>
                            </div>
                        </div>
                        <a href="${job.job_url}" target="_blank" class="btn btn-secondary" style="width: auto; padding: 6px 12px; font-size: 12px;">
                            <i class="fa-solid fa-external-link"></i> View on Naukri
                        </a>
                    </div>`;
                });
                container.innerHTML = html;
            } catch(e) {
                console.error(e);
            }
        }

        // Load applied history
        async function loadApplications() {
            try {
                const res = await fetch('/api/applications');
                const data = await res.json();
                const tbody = document.getElementById('applications-table-body');
                document.getElementById('stat-total-applied').innerText = data.length;
                
                if (data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px; color: var(--text-muted);">No application records found.</td></tr>';
                    return;
                }
                
                let html = '';
                data.forEach(app => {
                    const badgeClass = app.status.toLowerCase() === 'applied' ? 'badge-success' : 'badge-warning';
                    const pdfButton = app.resume_file 
                        ? `<a href="/api/pdf?file=${app.resume_file}" target="_blank" style="color: var(--secondary);"><i class="fa-solid fa-file-pdf"></i> cv.pdf</a>`
                        : `<a href="/api/pdf" target="_blank" style="color: var(--text-muted);"><i class="fa-solid fa-file-pdf"></i> Latest</a>`;
                        
                    html += `
                    <tr>
                        <td>${app.number}</td>
                        <td>${app.date}</td>
                        <td><strong>${app.company}</strong></td>
                        <td>${app.title}</td>
                        <td><span class="badge badge-info"><i class="fa-solid fa-star"></i> ${app.score}</span></td>
                        <td><span class="badge ${badgeClass}">${app.status}</span></td>
                        <td>${pdfButton}</td>
                    </tr>`;
                });
                tbody.innerHTML = html;
            } catch(e) {
                console.error(e);
            }
        }

        // Actions trigger
        async function triggerAction(endpoint, name) {
            try {
                const res = await fetch(endpoint, { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                    showToast(data.message);
                } else {
                    showToast(data.message, true);
                }
            } catch(e) {
                showToast(`Failed to trigger ${name}`, true);
            }
        }

        document.getElementById('btn-run-scheduler').addEventListener('click', () => triggerAction('/api/run', 'Scheduler'));
        document.getElementById('btn-run-login').addEventListener('click', () => triggerAction('/api/login-test', 'Login Check'));
        document.getElementById('btn-run-profile-update').addEventListener('click', () => triggerAction('/api/profile-update', 'Profile Update'));
        
        document.getElementById('btn-stop').addEventListener('click', async () => {
            const res = await fetch('/api/stop', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                showToast(data.message);
            } else {
                showToast(data.message, true);
            }
        });

        // Clear logs
        document.getElementById('btn-clear-logs').addEventListener('click', () => {
            document.getElementById('terminal-body').innerText = 'Logs cleared.';
        });

        // Poll engine status and logs
        let lastLogLength = 0;
        async function pollStatus() {
            try {
                const res = await fetch('/api/status');
                const status = await res.json();
                
                // Indicators
                const cookieDot = document.getElementById('cookie-dot');
                const cookieStatus = document.getElementById('cookie-status');
                if (status.session_exists) {
                    cookieDot.className = 'dot active';
                    cookieStatus.innerText = 'Valid / Cached';
                    document.getElementById('session-timestamp').innerText = `Session verified: ${status.session_time}`;
                } else {
                    cookieDot.className = 'dot inactive';
                    cookieStatus.innerText = 'Not Found';
                    document.getElementById('session-timestamp').innerText = `No session file found`;
                }
                
                const engineDot = document.getElementById('engine-dot');
                const engineStatus = document.getElementById('engine-status');
                const stopBtn = document.getElementById('btn-stop');
                
                if (status.running) {
                    engineDot.className = 'dot warning';
                    engineStatus.innerText = `Running (${status.active_task})`;
                    stopBtn.style.display = 'inline-flex';
                } else {
                    engineDot.className = 'dot active';
                    engineStatus.innerText = 'Idle';
                    stopBtn.style.display = 'none';
                }
                
                // Terminal output
                const terminal = document.getElementById('terminal-body');
                if (status.logs) {
                    terminal.innerText = status.logs;
                    // Auto-scroll to bottom if new content arrived
                    if (status.logs.length !== lastLogLength) {
                        terminal.scrollTop = terminal.scrollHeight;
                        lastLogLength = status.logs.length;
                        
                        // If task just finished, reload list of jobs/applications
                        if (!status.running) {
                            loadScrapedJobs();
                            loadApplications();
                        }
                    }
                } else if (!status.running) {
                    terminal.innerText = 'Console output will appear here when you run a task...';
                }
            } catch(e) {
                console.error("Error polling status", e);
            }
        }

        // Initial loading
        loadConfig();
        loadProfile();
        loadCV();
        loadScrapedJobs();
        loadApplications();
        
        // Start polling status
        setInterval(pollStatus, 1500);
        pollStatus();
    </script>
</body>
</html>
"""

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
