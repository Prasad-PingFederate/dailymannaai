import os
import json
import time
import asyncio
import hmac
import hashlib
import base64
import urllib.parse
from datetime import datetime
import aiohttp
import aiofiles
from dotenv import load_dotenv

# 1. Configuration
load_dotenv(".env.local")
CONN_STR = os.getenv("COSMOS_CONNECTION_STRING")

def parse_conn_str(conn_str):
    parts = {}
    for pair in conn_str.split(';'):
        if '=' in pair:
            key, val = pair.split('=', 1)
            parts[key] = val
    return parts['AccountEndpoint'], parts['AccountKey']

ENDPOINT, MASTER_KEY = parse_conn_str(CONN_STR)
DB_NAME = "BibleDatabase"
CONTAINER_NAME = "verses"
LOG_FILE = "master_migration.log"
LOOKUP_FILE = "cosmos_existing_ids.txt"
PROGRESS_FILE = "migration_progress.done"

# EXTREME Parallelism for 8,000 RU
MAX_CONCURRENT_REQUESTS = 3200 
MAX_CONCURRENT_FILES = 20
BATCH_SIZE = 1000

# 2. Global State
verses_pushed = 0
verses_skipped = 0
files_processed = 0
start_time = time.time()
KNOWN_IDS = set()
COMPLETED_FILES = set()

def log_msg(msg):
    ts = time.strftime("%H:%M:%S")
    formatted = f"[{ts}] {msg}"
    print(formatted)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(formatted + "\n")

def save_completed_file(fname):
    with open(PROGRESS_FILE, "a", encoding="utf-8") as f:
        f.write(fname + "\n")

def get_auth_header(verb, resource_type, resource_id, date):
    key = base64.b64decode(MASTER_KEY)
    text = f"{verb.lower()}\n{resource_type.lower()}\n{resource_id}\n{date.lower()}\n\n"
    hmac_obj = hmac.new(key, text.encode('utf-8'), hashlib.sha256)
    signature = base64.b64encode(hmac_obj.digest()).decode('utf-8')
    auth_str = urllib.parse.quote(f"type=master&ver=1.0&sig={signature}")
    return auth_str

async def upsert_verse(session, doc, sem):
    global verses_pushed
    resource_link = f"dbs/{DB_NAME}/colls/{CONTAINER_NAME}"
    url = f"{ENDPOINT}dbs/{DB_NAME}/colls/{CONTAINER_NAME}/docs"
    
    async with sem:
        # Aggressive retry for 429
        for attempt in range(20):
            date = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')
            auth = get_auth_header("POST", "docs", resource_link, date)
            
            headers = {
                "Authorization": auth,
                "x-ms-date": date,
                "x-ms-version": "2018-12-31",
                "x-ms-documentdb-is-upsert": "True",
                "Content-Type": "application/json",
                "x-ms-documentdb-partitionkey": json.dumps([doc["version"]])
            }
            
            try:
                async with session.post(url, json=doc, headers=headers, timeout=10) as resp:
                    if resp.status in [200, 201]:
                        verses_pushed += 1
                        return True
                    elif resp.status == 429:
                        # Dynamic backoff
                        retry_after = float(resp.headers.get("x-ms-retry-after-ms", 10)) / 1000.0
                        await asyncio.sleep(retry_after)
                    else:
                        await asyncio.sleep(0.2)
            except Exception:
                await asyncio.sleep(0.5)
        return False

async def process_file(session, file_path, sem, file_sem):
    global files_processed, verses_skipped
    fname = os.path.basename(file_path)
    if fname in COMPLETED_FILES:
        return

    async with file_sem:
        try:
            verses_to_push = []
            async with aiofiles.open(file_path, mode='r', encoding='utf-8') as f:
                async for line in f:
                    try:
                        raw = json.loads(line.strip())
                        v_code = raw.get("version")
                        vid = f"{raw.get('book')}_{raw.get('chapter')}_{raw.get('verse')}_{v_code}"
                        
                        if vid in KNOWN_IDS:
                            verses_skipped += 1
                            continue
                            
                        # Format as Cosmos Record
                        verses_to_push.append({
                            "id": vid, "verse_key": vid,
                            "book": raw.get("book"), "chapter": int(raw.get("chapter", 0)),
                            "verse": int(raw.get("verse", 0)), "text": raw.get("text"),
                            "version": v_code
                        })
                    except: continue
            
            if verses_to_push:
                # Group tasks for this file
                # Process in batches of 500 to maintain flow
                for i in range(0, len(verses_to_push), 500):
                    batch = verses_to_push[i:i+500]
                    tasks = [upsert_verse(session, v, sem) for v in batch]
                    await asyncio.gather(*tasks)
            
            save_completed_file(fname)
            files_processed += 1
                
        except Exception as e:
            log_msg(f"ERROR processing {fname}: {e}")

async def stats_loop():
    while True:
        await asyncio.sleep(10)
        elapsed = time.time() - start_time
        vps = verses_pushed / elapsed if elapsed > 0 else 0
        total_seen = verses_pushed + verses_skipped
        progress_msg = f"SCD-EXEC: Pushed: {verses_pushed:,} | Skipped: {verses_skipped:,} | Seen: {total_seen:,} | Speed: {vps:.0f} v/s"
        log_msg(progress_msg)

async def main():
    global start_time, KNOWN_IDS, COMPLETED_FILES
    log_msg("=" * 60)
    log_msg(" 🔥 ULTIMATE SCD PUSH & SKIP ENGINE (8,000 RU) 🔥")
    log_msg("=" * 60)
    
    # 1. Load Lookup set (7.7M IDs)
    if os.path.exists(LOOKUP_FILE):
        log_msg(f"Loading Lookup Set from {LOOKUP_FILE}...")
        with open(LOOKUP_FILE, "r", encoding="utf-8") as f:
            KNOWN_IDS = set(line.strip() for line in f)
        log_msg(f"Cached {len(KNOWN_IDS):,} IDs. Ready to skip.")
    
    # 2. Load Progress
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            COMPLETED_FILES = set(line.strip() for line in f)
        log_msg(f"Resuming: Already finished {len(COMPLETED_FILES)} files.")

    # 3. Discovery
    search_dirs = ["export", "processed_backup", "."]
    all_files = []
    for d in search_dirs:
        if os.path.exists(d):
            for f in os.listdir(d):
                if d == "." and not f.endswith("_export.json"): continue
                if f.endswith(".json") or f.endswith(".json.done") or f.endswith("_export.json"):
                    all_files.append(os.path.join(d, f))
    
    log_msg(f"Discovered {len(all_files)} files. Starting Processing...")
    
    sem = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
    file_sem = asyncio.Semaphore(MAX_CONCURRENT_FILES)
    start_time = time.time()
    
    conn = aiohttp.TCPConnector(limit=MAX_CONCURRENT_REQUESTS, ttl_dns_cache=300)
    async with aiohttp.ClientSession(connector=conn) as session:
        asyncio.create_task(stats_loop())
        # Large files come first (Sort descending)
        all_files.sort(key=lambda x: os.path.getsize(x), reverse=True)
        
        tasks = [process_file(session, f, sem, file_sem) for f in all_files]
        await asyncio.gather(*tasks)
            
    log_msg("MASTER MIGRATION COMPLETE!")

if __name__ == "__main__":
    asyncio.run(main())
