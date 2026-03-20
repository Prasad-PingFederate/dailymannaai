"""
resume_etl.py — Astra → Cosmos ETL (v3 - Connection Pool Fix)
- Uses a single shared CosmosClient with proper pool sizing
- Starts at 4 workers, can be bumped up safely
- Sequential file processing, parallel chunk uploads
- Full retry + backoff on 429/connection errors
"""
import os
import json
import time
import uuid
import logging
import threading
import concurrent.futures
from threading import Lock
from dotenv import load_dotenv
from astrapy import DataAPIClient
from azure.cosmos import CosmosClient
from azure.cosmos.exceptions import CosmosHttpResponseError

# ── Suppress noisy SDK logs ─────────────────────────────────────
logging.getLogger("azure").setLevel(logging.ERROR)
logging.getLogger("urllib3").setLevel(logging.ERROR)
logging.getLogger("urllib3.connectionpool").setLevel(logging.ERROR)

# ─────────────────────────────────────────────
# 1. Config — tweak CHUNK_WORKERS to scale up
# ─────────────────────────────────────────────
load_dotenv(".env.local")
ASTRA_TOKEN              = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
ASTRA_ENDPOINT           = os.getenv("ASTRA_DB_API_ENDPOINT")
COSMOS_CONNECTION_STRING = os.getenv("COSMOS_CONNECTION_STRING")

DB_NAME        = "BibleDatabase"
CONTAINER_NAME = "verses"
EXPORT_DIR     = "export"
CHUNK_SIZE     = 30        # verses per chunk
CHUNK_WORKERS  = 4         # ← start low, increase to 8→16→32 as it holds
PULL_WORKERS   = 6

# ─────────────────────────────────────────────
# 2. Single shared Cosmos client (thread-safe)
# ─────────────────────────────────────────────
cosmos_client = CosmosClient.from_connection_string(
    COSMOS_CONNECTION_STRING,
    connection_timeout=60,
    request_timeout=120,
    # Use direct mode for better throughput (falls back to gateway automatically)
)
astra_client  = DataAPIClient(ASTRA_TOKEN)
astra_db      = astra_client.get_database(ASTRA_ENDPOINT)
astra_coll    = astra_db.get_collection("bible_ar")

# ─────────────────────────────────────────────
# 3. Shared state
# ─────────────────────────────────────────────
lock           = Lock()
uploaded_total = 0
uploaded_files = 0
pull_done      = threading.Event()

# ─────────────────────────────────────────────
# 4. Cosmos upload helpers
# ─────────────────────────────────────────────
def get_container():
    db        = cosmos_client.get_database_client(DB_NAME)
    container = db.get_container_client(CONTAINER_NAME)
    container.read()
    return container

def upload_chunk(chunk, container):
    ok = 0
    for v in chunk:
        doc = {
            "id":        str(uuid.uuid4()),
            "verse_key": f"{v.get('book')}_{v.get('chapter')}_{v.get('verse')}_{v.get('version')}",
            "book":      v.get("book"),
            "chapter":   int(v.get("chapter", 0)),
            "verse":     int(v.get("verse", 0)),
            "text":      v.get("text"),
            "version":   v.get("version"),
        }
        for attempt in range(5):
            try:
                container.upsert_item(doc)
                ok += 1
                break
            except CosmosHttpResponseError as ce:
                if ce.status_code == 429:
                    wait = min(30, 2 ** attempt)
                    time.sleep(wait)
                else:
                    print(f"    ⚠️ HTTP {ce.status_code}: {str(ce)[:60]}")
                    break
            except Exception as e:
                err = str(e)
                if "Connection" in err or "timeout" in err.lower():
                    time.sleep(3 * (attempt + 1))  # wait and retry on conn err
                else:
                    print(f"    ⚠️ Error: {err[:80]}")
                    break
    return ok

def upload_file(file_path, container, file_label=""):
    global uploaded_total, uploaded_files
    if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
        return 0

    fname  = os.path.basename(file_path)
    verses = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    vd = json.loads(line.strip())
                    if vd: verses.append(vd)
                except: continue
    except Exception as e:
        print(f"  ❌ Read error {fname}: {e}")
        return 0

    if not verses:
        try: os.remove(file_path)
        except: pass
        return 0

    chunks = [verses[i:i+CHUNK_SIZE] for i in range(0, len(verses), CHUNK_SIZE)]
    count  = 0
    t0     = time.time()

    with concurrent.futures.ThreadPoolExecutor(max_workers=CHUNK_WORKERS) as ex:
        futs   = {ex.submit(upload_chunk, c, container): c for c in chunks}
        done_n = 0
        for fut in concurrent.futures.as_completed(futs):
            try:
                r = fut.result()
                count  += r
                done_n += 1
            except: pass

    elapsed = time.time() - t0
    vps     = count / elapsed if elapsed > 0 else 0

    with lock:
        uploaded_total += count
        uploaded_files += 1
        uf = uploaded_files
        ut = uploaded_total

    label = f"[{file_label}] " if file_label else ""
    print(f"  ✅ {label}{fname}  →  {count} verses  ({vps:.0f} v/s)  |  Total: {uf} files / {ut:,} verses")

    done_path = file_path + ".done"
    try:
        if os.path.exists(done_path): os.remove(done_path)
        os.rename(file_path, done_path)
    except Exception as e:
        print(f"  ⚠️ rename failed {fname}: {e}")

    return count


# ─────────────────────────────────────────────
# 5. Puller (background thread)
# ─────────────────────────────────────────────
def get_already_handled():
    handled = set()
    if not os.path.exists(EXPORT_DIR): return handled
    for f in os.listdir(EXPORT_DIR):
        if f.endswith(".json") or f.endswith(".done"):
            handled.add(f.replace(".json.done", "").replace(".json", ""))
    return handled

def pull_version(v_code):
    filename = os.path.join(EXPORT_DIR, f"{v_code}.json")
    tmp      = filename + ".tmp"
    if os.path.exists(filename + ".done"): return
    if os.path.exists(filename) and os.path.getsize(filename) > 0: return
    print(f"  🎣 [Pull] {v_code}...")
    for attempt in range(3):
        try:
            count = 0
            with open(tmp, "w", encoding="utf-8") as f:
                for doc in astra_coll.find({"version": v_code}):
                    doc.pop("_id", None)
                    f.write(json.dumps(doc, ensure_ascii=False) + "\n")
                    count += 1
            if count > 0:
                if os.path.exists(filename): os.remove(filename)
                os.rename(tmp, filename)
                print(f"  ✅ Pulled {v_code}: {count} verses")
            else:
                if os.path.exists(tmp): os.remove(tmp)
            return
        except Exception as e:
            print(f"  ⚠️ Retry {v_code} ({attempt+1}/3): {e}")
            if os.path.exists(tmp):
                try: os.remove(tmp)
                except: pass
            time.sleep(5)
    print(f"  ❌ Failed {v_code}")

def puller_thread():
    print("🛰️  [Puller] Scanning Astra for all versions (may take 2-3 min)...")
    all_v = set()
    try:
        for doc in astra_coll.find({}, limit=500000, projection={"version": 1}):
            v = doc.get("version")
            if v: all_v.add(v)
    except Exception as e:
        print(f"  ⚠️ Astra scan error: {e}")
    already = get_already_handled()
    to_pull = sorted(all_v - already)
    print(f"🛰️  [Puller] Astra: {len(all_v)} versions | Done: {len(already)} | Remaining: {len(to_pull)}")
    if not to_pull:
        print("🛰️  [Puller] Nothing new to pull!")
        pull_done.set()
        return
    with concurrent.futures.ThreadPoolExecutor(max_workers=PULL_WORKERS) as ex:
        futs = {ex.submit(pull_version, v): v for v in to_pull}
        for fut in concurrent.futures.as_completed(futs):
            try: fut.result()
            except Exception as e: print(f"  ❌ Pull worker: {e}")
    print("🛰️  [Puller] All versions pulled!")
    pull_done.set()


# ─────────────────────────────────────────────
# 6. Main
# ─────────────────────────────────────────────
def main():
    os.makedirs(EXPORT_DIR, exist_ok=True)
    print("=" * 60)
    print(f"  📖 DailyManna — Astra→Cosmos ETL  (workers={CHUNK_WORKERS})")
    print("=" * 60)

    print("\n🔌 Connecting to Cosmos DB...")
    container = get_container()
    print("  ✅ Connected!\n")

    # All currently pending files
    pending = sorted([
        os.path.join(EXPORT_DIR, f)
        for f in os.listdir(EXPORT_DIR)
        if f.endswith(".json") and not f.endswith(".done")
    ])
    total = len(pending)
    print(f"📂 {total} files ready to upload  (workers={CHUNK_WORKERS}/file)\n")

    # Start puller in background
    pt = threading.Thread(target=puller_thread, daemon=True)
    pt.start()

    # Upload pending files one at a time
    for i, fp in enumerate(pending, 1):
        sz = os.path.getsize(fp) / 1024
        print(f"\n📤 [{i}/{total}] {os.path.basename(fp)}  ({sz:.0f} KB)")
        upload_file(fp, container, file_label=f"{i}/{total}")

    # Watch for newly pulled files
    print("\n⏳ Pre-pulled files done. Watching for more from puller...")
    while not (pull_done.is_set() and not any(
        f.endswith(".json") and not f.endswith(".done")
        for f in os.listdir(EXPORT_DIR)
    )):
        new_files = sorted([
            os.path.join(EXPORT_DIR, f)
            for f in os.listdir(EXPORT_DIR)
            if f.endswith(".json") and not f.endswith(".done")
        ])
        if new_files:
            for fp in new_files:
                sz = os.path.getsize(fp) / 1024
                print(f"\n📤 [NEW] {os.path.basename(fp)} ({sz:.0f} KB)")
                upload_file(fp, container)
        else:
            time.sleep(5)

    pt.join(timeout=15)
    print("\n" + "=" * 60)
    print(f"  🎉 COMPLETE! {uploaded_total:,} verses in {uploaded_files} files")
    print("=" * 60)

if __name__ == "__main__":
    main()
