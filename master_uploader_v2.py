import os
import json
import time
import asyncio
import hmac
import hashlib
import base64
import urllib.parse
from datetime import datetime, timezone
import aiohttp
import aiofiles
from dotenv import load_dotenv

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

# OPTIMIZED Concurrency for 8,000+ RU
MAX_CONCURRENT_REQUESTS = 1800 # Less overhead, more throughput
MAX_CONCURRENT_FILES = 8
BATCH_SIZE = 100 

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

async def upsert_batch(session, v_code, docs, sem):
    global verses_pushed
    # Transactional Batch is complex in REST, sticking to Parallel Upsert but optimized
    tasks = [upsert_verse(session, doc, sem) for doc in docs]
    await asyncio.gather(*tasks)

async def upsert_verse(session, doc, sem):
    global verses_pushed
    resource_link = f"dbs/{DB_NAME}/colls/{CONTAINER_NAME}"
    url = f"{ENDPOINT}dbs/{DB_NAME}/colls/{CONTAINER_NAME}/docs"
    
    async with sem:
        for attempt in range(10):
            date = datetime.now(timezone.utc).strftime('%a, %d %b %Y %H:%M:%S GMT')
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
                async with session.post(url, json=doc, headers=headers, timeout=15) as resp:
                    if resp.status in [200, 201]:
                        verses_pushed += 1
                        return True
                    elif resp.status == 429:
                        retry_after = float(resp.headers.get("x-ms-retry-after-ms", 100)) / 1000.0
                        await asyncio.sleep(retry_after)
                    else:
                        await asyncio.sleep(0.1)
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
                            
                        verses_to_push.append({
                            "id": vid, "version": v_code,
                            "book": raw.get("book"), "chapter": int(raw.get("chapter", 0)),
                            "verse": int(raw.get("verse", 0)), "text": raw.get("text")
                        })
                    except: continue
            
            if verses_to_push:
                v_code = verses_to_push[0]["version"]
                # Group in chunks to avoid overwhelming event loop
                for i in range(0, len(verses_to_push), 200):
                    chunk = verses_to_push[i:i+200]
                    await upsert_batch(session, v_code, chunk, sem)
            
            save_completed_file(fname)
            files_processed += 1
            log_msg(f"Finished {fname} ({len(verses_to_push)} pushed / {verses_skipped} total skipped)")
                
        except Exception as e:
            log_msg(f"ERROR processing {fname}: {e}")

async def stats_loop():
    while True:
        await asyncio.sleep(10)
        elapsed = time.time() - start_time
        vps = verses_pushed / elapsed if elapsed > 0 else 0
        total_seen = verses_pushed + verses_skipped
        progress_msg = f"  📊 STATS: Pushed: {verses_pushed:,} | Skipped: {verses_skipped:,} | Speed: {vps:.0f} v/s"
        log_msg(progress_msg)

async def main():
    global start_time, KNOWN_IDS, COMPLETED_FILES
    log_msg("🚀 TURBO SCD PUSH ENGINE V2 - START")
    
    if os.path.exists(LOOKUP_FILE):
        log_msg(f"Loading {LOOKUP_FILE}...")
        with open(LOOKUP_FILE, "r", encoding="utf-8") as f:
            KNOWN_IDS = set(line.strip() for line in f)
        log_msg(f"Cached {len(KNOWN_IDS):,} IDs.")
    
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            COMPLETED_FILES = set(line.strip() for line in f)
        log_msg(f"Resuming: {len(COMPLETED_FILES)} files already done.")

    search_dirs = ["export", "processed_backup", "."]
    all_files = []
    for d in search_dirs:
        if os.path.exists(d):
            all_files.extend([os.path.join(d, f) for f in os.listdir(d) if (f.endswith(".json") or f.endswith(".json.done")) and not f == "package.json"])
    
    # Filter out files that are already completed
    all_files = [f for f in all_files if os.path.basename(f) not in COMPLETED_FILES]
    # Filter files that end in .json.done but are NOT in COMPLETED_FILES (might happen if another script did them)
    # Actually, master_uploader uses its own progress file. 

    log_msg(f"Processing {len(all_files)} files...")
    
    sem = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
    file_sem = asyncio.Semaphore(MAX_CONCURRENT_FILES)
    start_time = time.time()
    
    conn = aiohttp.TCPConnector(limit=MAX_CONCURRENT_REQUESTS, ttl_dns_cache=300)
    async with aiohttp.ClientSession(connector=conn) as session:
        asyncio.create_task(stats_loop())
        tasks = [process_file(session, f, sem, file_sem) for f in all_files]
        await asyncio.gather(*tasks)
            
    log_msg("✅ MIGRATION COMPLETE!")

if __name__ == "__main__":
    asyncio.run(main())
