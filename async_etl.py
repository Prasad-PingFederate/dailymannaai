"""
async_etl.py - TURBO V7 (The Final Push - New Data Only)
======================================================
- Synchronized Puller and Uploader
- Optimized for 8,000 RU
- Focuses on downloading NEW versions from Astra and uploading them
- FIXED: puller_done global scope
"""
import os
import json
import time
import asyncio
import logging
from dotenv import load_dotenv
from astrapy import DataAPIClient
from azure.cosmos.aio import CosmosClient
import aiofiles
import sys

if hasattr(sys.stdout, 'reconfigure'):
    try: sys.stdout.reconfigure(encoding='utf-8')
    except: pass

logging.getLogger("azure").setLevel(logging.ERROR)
load_dotenv(".env.local")

ASTRA_TOKEN    = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")
COSMOS_CONN    = os.getenv("COSMOS_CONNECTION_STRING")

DB_NAME        = "BibleDatabase"
CONTAINER_NAME = "verses"
EXPORT_DIR     = "export"

# Saturation for 8,000 RU
MAX_CONCURRENT_UPSERTS = 1000  
MAX_PULL_CONCURRENCY = 50

PROJECTION = {"book":1, "chapter":1, "verse":1, "text":1, "version":1}

# Global counters
verses_done = 0
files_done = 0
start_time = time.time()
cosmos_sem = None
puller_done = False # Global

async def upsert_worker(container, doc):
    global verses_done
    async with cosmos_sem:
        for attempt in range(10):
            try:
                await container.upsert_item(doc)
                verses_done += 1
                return True
            except Exception as e:
                err = str(e)
                if "429" in err:
                    await asyncio.sleep(0.1 * (attempt+1))
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
        
        if not docs: return

        tasks = [upsert_worker(container, d) for d in docs]
        await asyncio.gather(*tasks)
        
        files_done += 1
        print(f"  [UPLOAD DONE] {fname} ({len(docs)} verses)")
        
        done_path = file_path + ".done"
        if os.path.exists(done_path): os.remove(done_path)
        os.rename(file_path, done_path)
    except Exception as e:
        print(f"  [UPLOAD ERROR] {fname}: {e}")

async def pull_version(astra_coll, v_code, sem):
    filename = os.path.join(EXPORT_DIR, f"{v_code}.json")
    if os.path.exists(filename) or os.path.exists(filename + ".done"):
        return

    async with sem:
        print(f"    [PULLING] {v_code}...")
        tmp = filename + ".tmp"
        try:
            count = 0
            async with aiofiles.open(tmp, mode="w", encoding="utf-8") as f:
                cursor = astra_coll.find({"version": v_code}, projection=PROJECTION)
                async for doc in cursor:
                    doc.pop("_id", None)
                    await f.write(json.dumps(doc, ensure_ascii=False) + "\n")
                    count += 1
                
                if count == 0:
                    cursor = astra_coll.find({"version": v_code.upper()}, projection=PROJECTION)
                    async for doc in cursor:
                        doc.pop("_id", None)
                        await f.write(json.dumps(doc, ensure_ascii=False) + "\n")
                        count += 1

            if count > 0:
                os.rename(tmp, filename)
                print(f"    [PULLED] {v_code}: {count} verses downloaded.")
            else:
                if os.path.exists(tmp): os.remove(tmp)
        except Exception as e:
            print(f"    [PULL ERROR] {v_code}: {e}")
            if os.path.exists(tmp): os.remove(tmp)

async def stats_loop():
    while True:
        await asyncio.sleep(10)
        elapsed = time.time() - start_time
        if verses_done > 0:
            vps = verses_done / elapsed
            print(f"--- [PROGRESS] {verses_done:,} new verses | {files_done} files | Speed: {vps:.0f} v/s ---")

async def main():
    global cosmos_sem, puller_done, start_time
    os.makedirs(EXPORT_DIR, exist_ok=True)
    cosmos_sem = asyncio.Semaphore(MAX_CONCURRENT_UPSERTS)
    pull_sem = asyncio.Semaphore(MAX_PULL_CONCURRENCY)
    start_time = time.time()

    print("-" * 65)
    print("  COSMOS TURBO V7: THE FINAL PUSH (8,000 RU)")
    print("-" * 65)

    # Init Astra
    astra_client = DataAPIClient(ASTRA_TOKEN)
    astra_db = astra_client.get_async_database_by_api_endpoint(ASTRA_ENDPOINT)
    astra_coll = astra_db.get_collection("bible_ar")

    # Init Cosmos
    cosmos_client = CosmosClient.from_connection_string(COSMOS_CONN)
    async with cosmos_client:
        container = cosmos_client.get_database_client(DB_NAME).get_container_client(CONTAINER_NAME)
        
        asyncio.create_task(stats_loop())

        # 1. Get all eligible versions
        all_v = []
        if os.path.exists("refined_eligible.json"):
            with open("refined_eligible.json", "r", encoding="utf-8") as f:
                all_v = [item["id"] for item in json.load(f) if item.get("id")]
        
        # 2. Filter out already handled versions
        handled = set()
        for f in os.listdir(EXPORT_DIR):
            if f.endswith(".json") or f.endswith(".done"):
                base = f.replace(".json.done", "").replace(".json", "")
                handled.add(base.upper())
        if os.path.exists("skipped_old"):
            for f in os.listdir("skipped_old"):
                base = f.replace(".json", "")
                handled.add(base.upper())

        to_pull = [v for v in all_v if v.upper() not in handled]
        print(f"Starting Download: {len(to_pull)} new versions to fetch from Astra.")

        # 3. Pulling task
        async def run_puller():
            global puller_done
            tasks = [pull_version(astra_coll, v, pull_sem) for v in to_pull]
            await asyncio.gather(*tasks)
            puller_done = True
            print("PULLER FINISHED: All files downloaded from Astra.")

        asyncio.create_task(run_puller())

        # 4. Uploader loop
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

        print("\n" + "=" * 65)
        print("MIGRATION COMPLETE!")
        print(f"Total New Verses: {verses_done:,}")
        print("=" * 65)

if __name__ == "__main__":
    asyncio.run(main())
