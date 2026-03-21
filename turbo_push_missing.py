"""
TURBO ETL BULK UPLOADER for missing Bible languages
Uses 1800 concurrent REST API calls - same engine as master_uploader_v2.py
Target: CTUBL, KYG, DWW, CES1613, CESLB, CESNKB, ISL, KGF, SSD
"""
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

# Target files - only the newly ingested ones (not yet uploaded or partially uploaded)
TARGET_VERSIONS = ["CTUBL", "KYG", "DWW", "CES1613", "CESLB", "CESNKB", "ISL", "KGF", "SSD"]

# ETL TURBO settings
MAX_CONCURRENT = 1500  # concurrent HTTP requests
CHUNK_SIZE = 500       # batch size sent to gather()

verses_pushed = 0
verses_failed = 0
start_time = time.time()

def get_auth_header(verb, resource_type, resource_id, date):
    key = base64.b64decode(MASTER_KEY)
    text = f"{verb.lower()}\n{resource_type.lower()}\n{resource_id}\n{date.lower()}\n\n"
    hmac_obj = hmac.new(key, text.encode('utf-8'), hashlib.sha256)
    signature = base64.b64encode(hmac_obj.digest()).decode('utf-8')
    return urllib.parse.quote(f"type=master&ver=1.0&sig={signature}")

async def upsert_verse(session, doc, sem):
    global verses_pushed, verses_failed
    resource_link = f"dbs/{DB_NAME}/colls/{CONTAINER_NAME}"
    url = f"{ENDPOINT}dbs/{DB_NAME}/colls/{CONTAINER_NAME}/docs"

    async with sem:
        for attempt in range(8):
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
                async with session.post(url, json=doc, headers=headers, timeout=aiohttp.ClientTimeout(total=20)) as resp:
                    if resp.status in [200, 201]:
                        verses_pushed += 1
                        return True
                    elif resp.status == 429:
                        retry_ms = float(resp.headers.get("x-ms-retry-after-ms", 200)) / 1000.0
                        await asyncio.sleep(retry_ms)
                    else:
                        body = await resp.text()
                        await asyncio.sleep(0.2)
            except Exception:
                await asyncio.sleep(0.5 * (attempt + 1))
        verses_failed += 1
        return False

async def process_version(session, version_id, file_path, sem):
    print(f"[{version_id}] Loading {file_path}...")
    docs = []
    try:
        async with aiofiles.open(file_path, mode='r', encoding='utf-8') as f:
            async for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    raw = json.loads(line)
                    vid = f"{raw.get('book')}_{raw.get('chapter')}_{raw.get('verse')}_{version_id}"
                    docs.append({
                        "id": vid,
                        "version": version_id,
                        "book": raw.get("book"),
                        "chapter": int(raw.get("chapter", 0)),
                        "verse": int(raw.get("verse", 0)),
                        "text": raw.get("text", "")
                    })
                except:
                    continue
    except Exception as e:
        print(f"[{version_id}] ERROR reading file: {e}")
        return

    total = len(docs)
    print(f"[{version_id}] Queuing {total:,} verses for TURBO upload...")
    t0 = time.time()

    # Fire all in chunks to avoid memory overload
    for i in range(0, total, CHUNK_SIZE):
        chunk = docs[i:i + CHUNK_SIZE]
        tasks = [upsert_verse(session, doc, sem) for doc in chunk]
        await asyncio.gather(*tasks)
        pct = min(i + CHUNK_SIZE, total) / total * 100
        elapsed = time.time() - t0
        vps = (i + CHUNK_SIZE) / elapsed if elapsed > 0 else 0
        print(f"[{version_id}] {min(i+CHUNK_SIZE, total):,}/{total:,} ({pct:.0f}%) — {vps:.0f} v/s")

    elapsed = time.time() - t0
    print(f"[{version_id}] ✅ Done: {total:,} verses in {elapsed:.0f}s ({total/elapsed:.0f} v/s avg)")

    # Rename to .done 
    try:
        os.rename(file_path, file_path + ".done")
    except:
        pass

async def stats_loop():
    while True:
        await asyncio.sleep(15)
        elapsed = time.time() - start_time
        vps = verses_pushed / elapsed if elapsed > 0 else 0
        print(f"  📊 Total pushed: {verses_pushed:,} | Failed: {verses_failed} | Speed: {vps:.0f} v/s")

async def main():
    global start_time
    start_time = time.time()
    print("🚀 TURBO ETL BULK UPLOADER — START")
    print(f"   Concurrency: {MAX_CONCURRENT} | Chunk: {CHUNK_SIZE}")

    # Find all target JSON files in export/
    tasks_to_run = []
    for version in TARGET_VERSIONS:
        # Check both .json and .json.done (in case partly done)
        for candidate in [f"export/{version}.json", f"export/{version.lower()}.json"]:
            if os.path.exists(candidate):
                tasks_to_run.append((version, candidate))
                break
        else:
            print(f"[{version}] Skipping — file not found (already fully uploaded?)")

    if not tasks_to_run:
        print("No files to upload. All done!")
        return

    print(f"\nFiles to upload: {[v for v, _ in tasks_to_run]}\n")

    sem = asyncio.Semaphore(MAX_CONCURRENT)
    conn = aiohttp.TCPConnector(limit=MAX_CONCURRENT, ttl_dns_cache=300)

    async with aiohttp.ClientSession(connector=conn) as session:
        asyncio.create_task(stats_loop())
        # Run ALL versions fully in parallel
        await asyncio.gather(*[process_version(session, v, f, sem) for v, f in tasks_to_run])

    elapsed = time.time() - start_time
    print(f"\n🏁 ALL DONE — {verses_pushed:,} verses pushed in {elapsed:.0f}s ({verses_pushed/elapsed:.0f} v/s avg)")

if __name__ == "__main__":
    asyncio.run(main())
