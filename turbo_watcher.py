import os
import json
import time
import concurrent.futures
import uuid
from threading import Lock
from dotenv import load_dotenv
from azure.cosmos import CosmosClient
from azure.cosmos.exceptions import CosmosHttpResponseError

# 1. Load Credentials
load_dotenv(".env.local")
COSMOS_CONNECTION_STRING = os.getenv("COSMOS_CONNECTION_STRING")

# 2. Configuration
DB_NAME = "BibleDatabase"
CONTAINER_NAME = "verses"
MAX_UPLOAD_WORKERS = 100 # Balanced for stability
CHUNK_SIZE = 40           

# 3. Setup Clients
# Using a higher timeout for connectivity robustness
cosmos_client = CosmosClient.from_connection_string(
    COSMOS_CONNECTION_STRING, 
    connection_timeout=30,      # Give more time for DNS/Initial handshake
    request_timeout=30         # Give more time for heavy writes
)
progress_lock = Lock()
GLOBAL_COUNT = 0 # Simple name to avoid linter confusion

def setup_cosmos():
    try:
        db = cosmos_client.get_database_client(DB_NAME)
        container = db.get_container_client(CONTAINER_NAME)
        # Quick test to ensure container exists
        container.read()
        return container
    except Exception as e:
        print(f"❌ Initial Cosmos connection failed: {e}")
        time.sleep(5)
        return setup_cosmos()

def upload_chunk(chunk, container):
    """Processes a small chunk of verses in a single thread with internal retries"""
    success_count = 0
    for verse_data in chunk:
        try:
            doc = {
                "id": str(uuid.uuid4()),
                "verse_key": f"{verse_data.get('book')}_{verse_data.get('chapter')}_{verse_data.get('verse')}_{verse_data.get('version')}",
                "book": verse_data.get("book"),
                "chapter": int(verse_data.get("chapter", 0)),
                "verse": int(verse_data.get("verse", 0)),
                "text": verse_data.get("text"),
                "version": verse_data.get("version"),
                "vector": None
            }
            # Internal Retry for 429s or transient glitches
            for attempt in range(3):
                try:
                    container.upsert_item(doc)
                    success_count += 1
                    break
                except CosmosHttpResponseError as ce:
                    if ce.status_code == 429:
                        time.sleep(2 * (attempt + 1))
                    else: raise
        except Exception:
            continue
    return success_count

def safe_move(old_path, new_path):
    for i in range(5):
        try:
            if os.path.exists(new_path): os.remove(new_path)
            os.rename(old_path, new_path)
            return True
        except:
            time.sleep(2)
    return False

def pull_and_push_file(file_path, container):
    global GLOBAL_COUNT
    if not os.path.exists(file_path) or os.path.getsize(file_path) == 0: return

    file_name = os.path.basename(file_path)
    print(f"🚛 [ETL] Processing {file_name}...")
    
    verses = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    v = json.loads(line.strip())
                    if v: verses.append(v)
                except: continue
        
        if not verses:
            os.remove(file_path) # Clean up empty junk
            return

        # Split into chunks
        chunks = [verses[i:i + CHUNK_SIZE] for i in range(0, len(verses), CHUNK_SIZE)]
        
        file_count = 0
        start_time = time.time()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_UPLOAD_WORKERS) as executor:
            future_to_chunk = {executor.submit(upload_chunk, c, container): c for c in chunks}
            for future in concurrent.futures.as_completed(future_to_chunk):
                try:
                    file_count += future.result()
                except: pass
        
        elapsed = time.time() - start_time
        vps = file_count / elapsed if elapsed > 0 else 0
        
        with progress_lock:
            GLOBAL_COUNT += file_count
        
        print(f"✨ [ETL] Completed {file_name}: {file_count} verses ({vps:.1f} v/s)")
        
        if safe_move(file_path, file_path + ".done"):
            pass
    except Exception as e:
        print(f"❌ [ETL] Fatal error on {file_name}: {e}")
        time.sleep(5) # Cooldown on network error

def main():
    print("💎 Dailymanna Turbo ETL - Version 3.1 (Resilience Patch)")
    container = setup_cosmos()
    print(f"🚀 Grid Active: {MAX_UPLOAD_WORKERS} workers")

    while True:
        if not os.path.exists("export"): os.makedirs("export")
        
        files = sorted([os.path.join("export", f) for f in os.listdir("export") if f.endswith(".json") and not f.endswith(".done")])
        
        ready_files = []
        for f in files:
            try:
                s1 = os.path.getsize(f)
                time.sleep(0.5)
                s2 = os.path.getsize(f)
                if s1 == s2 and s1 > 0: ready_files.append(f)
            except: continue
            
        if not ready_files:
            time.sleep(5)
            continue
            
        for file in ready_files:
            pull_and_push_file(file, container)
            
if __name__ == "__main__":
    main()
