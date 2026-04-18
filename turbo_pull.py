import os
import json
import concurrent.futures
import threading
from dotenv import load_dotenv
from astrapy import DataAPIClient
import time

# 1. Setup
load_dotenv(".env.local")
ASTRA_TOKEN = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")

client = DataAPIClient(ASTRA_TOKEN, caller_name="turbo_puller_resilient")
db = client.get_database(ASTRA_ENDPOINT)
coll = db.get_collection("bible_ar")

# Global variables
discovered_versions = set()
processed_versions = set()
v_lock = threading.Lock()

def get_existing_progress():
    """Identify which versions are already in the export folder (done or pending)"""
    existing = set()
    if os.path.exists("export"):
        for f in os.listdir("export"):
            if f.endswith(".json") or f.endswith(".json.done"):
                v = f.replace(".json.done", "").replace(".json", "")
                existing.add(v)
    return existing

def get_known_versions():
    """Extract versions from the existing partial export file to jumpstart the process"""
    versions = set()
    if os.path.exists("bible_ar_export.json"):
        print("📖 Reading known versions from local cache...")
        try:
            with open("bible_ar_export.json", "r", encoding="utf-8") as f:
                for i, line in enumerate(f):
                    try:
                        data = json.loads(line)
                        v = data.get("version")
                        if v: versions.add(v)
                    except: continue
                    if i > 500000: break # Quick look
        except Exception as e:
            print(f"⚠️ Error reading cache: {e}")
    return versions

def discovery_worker():
    """Background thread to find MORE versions while we download known ones"""
    print("🛰️ [Discovery] Astra deep scan started...")
    try:
        # Increase limit to cover all potential 1000+ languages
        for doc in coll.find({}, limit=500000, projection={"version": 1}):
            v = doc.get("version")
            if v:
                with v_lock:
                    discovered_versions.add(v)
    except Exception as e:
        print(f"⚠️ Discovery error: {e}")
    print(f"🛰️ [Discovery] Astra scan complete. Total unique versions found: {len(discovered_versions)}")

def download_version(v_code):
    filename = f"export/{v_code}.json"
    
    # Check if already exists or done
    if os.path.exists(filename) and os.path.getsize(filename) > 0:
        with v_lock: processed_versions.add(v_code)
        return
    if os.path.exists(filename + ".done"):
        with v_lock: processed_versions.add(v_code)
        return
        
    print(f"🎣 [Pulling] {v_code}...")
    retries = 3
    while retries > 0:
        try:
            count = 0
            start_time = time.time()
            # Write to a temp file first to avoid watcher picking up empty/partial files
            tmp_filename = filename + ".tmp"
            with open(tmp_filename, 'w', encoding='utf-8') as f:
                for doc in coll.find({"version": v_code}):
                    if "_id" in doc: del doc["_id"]
                    f.write(json.dumps(doc, ensure_ascii=False) + "\n")
                    count += 1
            
            if count > 0:
                os.rename(tmp_filename, filename)
                elapsed = time.time() - start_time
                print(f"✅ Extracted {v_code}: {count} verses in {elapsed:.2f}s")
                with v_lock: processed_versions.add(v_code)
                return
            else:
                if os.path.exists(tmp_filename): os.remove(tmp_filename)
                with v_lock: processed_versions.add(v_code)
                return
        except Exception as e:
            retries -= 1
            print(f"⚠️ Retry {v_code} ({3-retries}/3): {e}")
            time.sleep(3)
    
    print(f"❌ Failed {v_code} after 3 attempts.")

def main():
    if not os.path.exists("export"): os.makedirs("export")
        
    global discovered_versions, processed_versions
    
    # 1. Initialize progress from disk
    processed_versions = get_existing_progress()
    discovered_versions = get_known_versions() | processed_versions
    
    print(f"🎯 Resume Point: {len(processed_versions)} versions already handled.")
    
    # 2. Start discovery in background
    d_thread = threading.Thread(target=discovery_worker, daemon=True)
    d_thread.start()
    
    # 3. Starting the Worker Grid (12 parallel lanes)
    print(f"🚀 Launching Parallel Puller Grid (12 workers)...")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as executor:
        active_futures = set()
        
        while True:
            with v_lock:
                to_pull = list(discovered_versions - processed_versions)
            
            # Submit new work
            for v in to_pull:
                if not any(hasattr(f, '_v') and f._v == v for f in active_futures):
                    future = executor.submit(download_version, v)
                    future._v = v
                    active_futures.add(future)
            
            # Re-check status of active work
            done, active_futures = concurrent.futures.wait(active_futures, timeout=1, return_when=concurrent.futures.FIRST_COMPLETED)
            
            # Check if finished
            with v_lock:
                if not active_futures and len(discovered_versions) == len(processed_versions) and not d_thread.is_alive():
                    print("🏁 All extraction complete!")
                    break
            
            time.sleep(2)

if __name__ == "__main__":
    main()
