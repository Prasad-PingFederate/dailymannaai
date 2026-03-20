import os
import json
import time
import concurrent.futures
from dotenv import load_dotenv
from azure.cosmos import CosmosClient, PartitionKey
from azure.cosmos.exceptions import CosmosHttpResponseError

# 1. Load Credentials
load_dotenv(".env.local")
COSMOS_CONNECTION_STRING = os.getenv("COSMOS_CONNECTION_STRING")

# 2. Setup Clients
cosmos_client = CosmosClient.from_connection_string(COSMOS_CONNECTION_STRING)

# 3. Target Configuration
DB_NAME = "BibleDatabase"
CONTAINER_NAME = "verses"
MAX_UPLOAD_WORKERS = 60  # TURBO MODE: 6x more workers
BATCH_SIZE = 200        # Larger batches for the executor

def setup_cosmos():
    db = cosmos_client.get_database_client(DB_NAME)
    container = db.get_container_client(CONTAINER_NAME)
    return container

def upload_verse(verse_data, container):
    """Processes and uploads a single verse JSON object"""
    try:
        # TURBO: Skip all OpenAI/Vector logic for now. 
        # We can backfill vectors inside Azure later.
        
        # 1. Format for Cosmos
        doc = {
            "id": f"{verse_data.get('book')}_{verse_data.get('chapter')}_{verse_data.get('verse')}_{verse_data.get('version')}",
            "book": verse_data.get("book"),
            "chapter": int(verse_data.get("chapter", 0)),
            "verse": int(verse_data.get("verse", 0)),
            "text": verse_data.get("text"),
            "version": verse_data.get("version"),
            "vector": None # Placeholder for later backfill
        }
        
        # 2. Upsert to Cosmos with Retry
        retries = 5
        while retries > 0:
            try:
                container.upsert_item(doc)
                return True
            except CosmosHttpResponseError as e:
                if e.status_code == 429:
                    # Throttling is normal in Turbo mode
                    wait = float(e.headers.get("x-ms-retry-after-ms", 500)) / 1000.0
                    time.sleep(wait)
                    retries -= 1
                else:
                    return False
        return False
    except Exception:
        return False

def upload_file(file_path, container):
    """Reads a JSON-L file and uploads items in parallel with TURBO speed"""
    print(f"🔥 [TURBO UPLOAD] {os.path.basename(file_path)}")
    
    count = 0
    start_time = time.time()
    
    with open(file_path, 'r', encoding='utf-8') as f:
        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_UPLOAD_WORKERS) as executor:
            batch = []
            for line in f:
                try:
                    verse = json.loads(line.strip())
                    batch.append(verse)
                except:
                    continue
                
                if len(batch) >= BATCH_SIZE:
                    futures = [executor.submit(upload_verse, v, container) for v in batch]
                    concurrent.futures.wait(futures)
                    count += len(batch)
                    batch = []
                    
                    # Print speed stats
                    elapsed = time.time() - start_time
                    speed = count / elapsed if elapsed > 0 else 0
                    print(f"  ⚡ {os.path.basename(file_path)}: {count} uploaded ({int(speed)} verses/sec)")
            
            # Final batch
            if batch:
                futures = [executor.submit(upload_verse, v, container) for v in batch]
                concurrent.futures.wait(futures)
                count += len(batch)

    print(f"✅ Finished {os.path.basename(file_path)}: {count} total in {int(time.time() - start_time)}s")

def main():
    container = setup_cosmos()
    
    # Get all export files
    files = [f for f in os.listdir('.') if f.endswith('_export.json')]
    
    # Priority: Move the big Arabic file first if it has content, or all others
    files.sort(key=lambda x: os.path.getsize(x), reverse=True)
    
    print(f"🚀 TURBO MODE ENABLED. Using {MAX_UPLOAD_WORKERS} workers.")
    
    for file in files:
        if os.path.getsize(file) > 0:
            upload_file(file, container)

if __name__ == "__main__":
    main()
