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
from dotenv import load_dotenv

# 1. Config & Auth Logic
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
EXPORT_DIR = "export"

# Saturation for 8,000 RU
MAX_CONCURRENT_REQUESTS = 1500 

def get_auth_header(verb, resource_type, resource_id, date):
    key = base64.b64decode(MASTER_KEY)
    text = f"{verb.lower()}\n{resource_type.lower()}\n{resource_id}\n{date.lower()}\n\n"
    hmac_obj = hmac.new(key, text.encode('utf-8'), hashlib.sha256)
    signature = base64.b64encode(hmac_obj.digest()).decode('utf-8')
    auth_str = urllib.parse.quote(f"type=master&ver=1.0&sig={signature}")
    return auth_str

# 2. State
verses_done = 0
files_done = 0
start_time = time.time()

async def upsert_rest(session, doc, sem):
    global verses_done
    
    # Target Resource: dbs/{db}/colls/{coll}/docs
    resource_link = f"dbs/{DB_NAME}/colls/{CONTAINER_NAME}"
    url = f"{ENDPOINT}dbs/{DB_NAME}/colls/{CONTAINER_NAME}/docs"
    
    async with sem:
        for attempt in range(5):
            date = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')
            auth = get_auth_header("POST", "docs", resource_link, date)
            
            headers = {
                "Authorization": auth,
                "x-ms-date": date,
                "x-ms-version": "2018-12-31",
                "x-ms-documentdb-is-upsert": "True",
                "Content-Type": "application/json",
                "x-ms-documentdb-partitionkey": json.dumps([doc["version"]]) # Partition Key: /version
            }
            
            try:
                async with session.post(url, json=doc, headers=headers) as resp:
                    if resp.status in [200, 201]:
                        verses_done += 1
                        return True
                    elif resp.status == 429:
                        retry_after = float(resp.headers.get("x-ms-retry-after-ms", 100)) / 1000.0
                        await asyncio.sleep(retry_after)
                    else:
                        # print(f"Error {resp.status}: {await resp.text()}")
                        return False
            except Exception:
                await asyncio.sleep(0.5)
        return False

async def process_file(session, file_path, sem):
    global files_done
    fname = os.path.basename(file_path)
    docs = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    v = json.loads(line.strip())
                    v_code = v.get("version")
                    vid = f"{v.get('book')}_{v.get('chapter')}_{v.get('verse')}_{v_code}"
                    docs.append({
                        "id": vid,
                        "book": v.get("book"),
                        "chapter": int(v.get("chapter", 0)),
                        "verse": int(v.get("verse", 0)),
                        "text": v.get("text"),
                        "version": v_code
                    })
                except: continue
        
        if not docs:
            os.remove(file_path)
            return

        tasks = [upsert_rest(session, d, sem) for d in docs]
        await asyncio.gather(*tasks)
        
        files_done += 1
        print(f"  [REST DONE] {fname} ({len(docs)} verses)")
        
        done_path = file_path + ".done"
        if os.path.exists(done_path): os.remove(done_path)
        os.rename(file_path, done_path)
    except Exception as e:
        print(f"  [REST ERROR] {fname}: {e}")

async def stats_loop():
    while True:
        await asyncio.sleep(10)
        elapsed = time.time() - start_time
        vps = verses_done / elapsed if elapsed > 0 else 0
        print(f"--- [STAT] {verses_done:,} verses | {files_done} files | Speed: {vps:.0f} v/s ---")

async def main():
    global start_time
    print("-" * 60)
    print("  COSMOS REST TURBO V1 (Targeting 8,000 RU)")
    print("-" * 60)
    
    sem = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
    start_time = time.time()
    
    async with aiohttp.ClientSession() as session:
        asyncio.create_task(stats_loop())
        
        while True:
            files = [
                os.path.join(EXPORT_DIR, f)
                for f in os.listdir(EXPORT_DIR)
                if f.endswith(".json") and not f.endswith(".done")
            ]
            
            if not files:
                print("No pending files found. Waiting 5s...")
                await asyncio.sleep(5)
                # Check again, if still no files, maybe we are done?
                # For now let's keep it running.
                continue

            # Process files one by one or in small batches to avoid memory overload
            # but using the semaphore for global concurrency
            for f in files:
                await process_file(session, f, sem)
            
            await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(main())
