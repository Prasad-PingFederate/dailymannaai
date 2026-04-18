"""
async_etl_v8.py - TURBO V8 (LIVE LOGGING & SYNC)
===============================================
- Optimized for 8,000 RU
- Logs to live_migration_log.txt for user tracking
- Synchronized Pulling & Uploading
"""
import os
import json
import time
import asyncio
import logging
import sys
from dotenv import load_dotenv
from astrapy import DataAPIClient
from azure.cosmos.aio import CosmosClient
import aiofiles

# 1. Setup Logging
log_file = "live_migration_log.txt"
def log_msg(msg):
    timestamp = time.strftime("%H:%M:%S")
    formatted = f"[{timestamp}] {msg}"
    print(formatted)
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(formatted + "\n")

# 2. Config
load_dotenv(".env.local")
ASTRA_TOKEN    = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")
COSMOS_CONN    = os.getenv("COSMOS_CONNECTION_STRING")

DB_NAME        = "BibleDatabase"
CONTAINER_NAME = "verses"
EXPORT_DIR     = "export"

MAX_CONCURRENT_UPSERTS = 1200 # Slightly more aggressive
MAX_PULL_CONCURRENCY   = 40
PROJECTION = {"book":1, "chapter":1, "verse":1, "text":1, "version":1}

# 3. State
verses_done = 0
files_done = 0
start_time = time.time()
cosmos_sem = None
puller_done = False

async def upsert_worker(container, doc):
    global verses_done
    async with cosmos_sem:
        for attempt in range(5):
            try:
                await container.upsert_item(doc)
                verses_done += 1
                return True
            except Exception as e:
                err = str(e)
                if "429" in err:
                    # Adaptive backoff
                    wait = 0.1 * (attempt + 1)
                    await asyncio.sleep(wait)
                else:
                    return False
        return False

async def upload_file(container, file_path):
    global files_done
    fname = os.path.basename(file_path)
    try:
        docs = []
        async with aiofiles.open(file_path, mode='r', encoding='utf-8') as f:
            async for line in f:
                try:
                    v = json.loads(line.strip())
                    v_code = v.get("version")
                    vid = f"{v.get('book')}_{v.get('chapter')}_{v.get('verse')}_{v_code}"
                    docs.append({
                        "id": vid, "verse_key": vid,
                        "book": v.get("book"), "chapter": int(v.get("chapter", 0)),
                        "verse": int(v.get("verse", 0)), "text": v.get("text"),
                        "version": v_code
                    })
                except: continue
        
        if not docs:
            log_msg(f"  [SKIP] {fname} is empty.")
            os.remove(file_path)
            return

        tasks = [upsert_worker(container, d) for d in docs]
        await asyncio.gather(*tasks)
        
        files_done += 1
        log_msg(f"  [COSMOS DONE] {fname} ({len(docs)} verses)")
        
        done_path = file_path + ".done"
        if os.path.exists(done_path): os.remove(done_path)
        os.rename(file_path, done_path)
    except Exception as e:
        log_msg(f"  [UPLOAD ERROR] {fname}: {e}")

async def pull_version(astra_coll, v_code, sem):
    filename = os.path.join(EXPORT_DIR, f"{v_code}.json")
    if os.path.exists(filename) or os.path.exists(filename + ".done"):
        return

    async with sem:
        tmp = filename + ".tmp"
        try:
            count = 0
            async with aiofiles.open(tmp, mode="w", encoding="utf-8") as f:
                cursor = astra_coll.find({"version": v_code}, projection=PROJECTION)
                async for doc in cursor:
                    doc.pop("_id", None)
                    await f.write(json.dumps(doc, ensure_ascii=False) + "\n")
                    count += 1
                
                if count == 0: # Try uppercase
                    cursor = astra_coll.find({"version": v_code.upper()}, projection=PROJECTION)
                    async for doc in cursor:
                        doc.pop("_id", None)
                        await f.write(json.dumps(doc, ensure_ascii=False) + "\n")
                        count += 1

            if count > 0:
                os.rename(tmp, filename)
                log_msg(f"  [ASTRA PULLED] {v_code} ({count} verses)")
            else:
                if os.path.exists(tmp): os.remove(tmp)
        except Exception as e:
            log_msg(f"  [PULL ERROR] {v_code}: {e}")
            if os.path.exists(tmp): os.remove(tmp)

async def stats_loop():
    while True:
        await asyncio.sleep(15)
        elapsed = time.time() - start_time
        vps = verses_done / elapsed if elapsed > 0 else 0
        log_msg(f"STAT: {verses_done:,} verses | {files_done} files | Speed: {vps:.0f} v/s")

async def main():
    global cosmos_sem, puller_done, start_time
    if os.path.exists(log_file): os.remove(log_file)
    
    log_msg("-" * 50)
    log_msg(" COSMOS TURBO V8: LIVE MIGRATION INITIALIZED")
    log_msg("-" * 50)

    os.makedirs(EXPORT_DIR, exist_ok=True)
    cosmos_sem = asyncio.Semaphore(MAX_CONCURRENT_UPSERTS)
    pull_sem = asyncio.Semaphore(MAX_PULL_CONCURRENCY)
    start_time = time.time()

    # Init Astra
    astra_client = DataAPIClient(ASTRA_TOKEN)
    astra_db = astra_client.get_async_database_by_api_endpoint(ASTRA_ENDPOINT)
    astra_coll = astra_db.get_collection("bible_ar")

    # Init Cosmos
    cosmos_client = CosmosClient.from_connection_string(COSMOS_CONN)
    async with cosmos_client:
        container = cosmos_client.get_database_client(DB_NAME).get_container_client(CONTAINER_NAME)
        asyncio.create_task(stats_loop())

        # 1. Load Versions
        with open("refined_eligible.json", "r", encoding="utf-8") as f:
            all_v = [item["id"] for item in json.load(f) if item.get("id")]
        
        # 2. Filter handled
        handled = set()
        for f in os.listdir(EXPORT_DIR):
            base = f.replace(".json.done", "").replace(".json", "").upper()
            handled.add(base)
        
        to_pull = [v for v in all_v if v.upper() not in handled]
        log_msg(f"PULL QUEUE: {len(to_pull)} versions pending from Astra.")

        async def run_puller():
            global puller_done
            tasks = [pull_version(astra_coll, v, pull_sem) for v in to_pull]
            await asyncio.gather(*tasks)
            puller_done = True
            log_msg("PULLER COMPLETE: All new data fetched from Astra.")

        asyncio.create_task(run_puller())

        # 3. Uploader Loop
        active_uploads = set()
        while not (puller_done and not any(f.endswith(".json") and not f.endswith(".done") for f in os.listdir(EXPORT_DIR))):
            files = [
                os.path.join(EXPORT_DIR, f)
                for f in os.listdir(EXPORT_DIR)
                if f.endswith(".json") and not f.endswith(".done")
            ]
            
            for f in files:
                if f not in active_uploads:
                    active_uploads.add(f)
                    async def up_and_clear(fp):
                        await upload_file(container, fp)
                        active_uploads.discard(fp)
                    asyncio.create_task(up_and_clear(f))
            
            await asyncio.sleep(2)

        log_msg("ALL TASKS COMPLETE. MIGRATION FINISHED.")

if __name__ == "__main__":
    asyncio.run(main())
