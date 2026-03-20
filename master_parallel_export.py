import os
import json
import concurrent.futures
from dotenv import load_dotenv
from astrapy import DataAPIClient
import time

# 1. Setup
load_dotenv(".env.local")
ASTRA_TOKEN = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")

client = DataAPIClient(ASTRA_TOKEN)
db = client.get_database(ASTRA_ENDPOINT)
coll = db.get_collection("bible_ar")

def get_all_versions():
    print("🛰️ Scanning Bible Master Table for unique languages...")
    versions = set()
    # Deep scan 200k records to catch all 1000+ versions
    count = 0
    for doc in coll.find({}, limit=200000):
        v = doc.get("version")
        if v:
            versions.add(v)
        count += 1
        if count % 20000 == 0:
            print(f"  🔍 Scanned {count} records, found {len(versions)} unique versions...")
    
    return sorted(list(versions))

def download_version(v_code):
    try:
        filename = f"export/ar_{v_code}.json"
        if os.path.exists(filename):
            return True
            
        # Target find for specific version
        count = 0
        with open(filename, 'w', encoding='utf-8') as f:
            for doc in coll.find({"version": v_code}):
                if "_id" in doc: del doc["_id"]
                f.write(json.dumps(doc, ensure_ascii=False) + "\n")
                count += 1
        
        if count > 0:
            print(f"✅ Downloaded {v_code}: {count} verses.")
        else:
            os.remove(filename) # Clean up empty fires
        return True
    except Exception as e:
        print(f"❌ Error downloading {v_code}: {e}")
        return False

def main():
    if not os.path.exists("export"):
        os.makedirs("export")

    # Step 1: Get the list
    all_v = get_all_versions()
    print(f"🚀 Found total of {len(all_v)} languages. Starting Parallel Turbo Download.")
    
    # Step 2: Parallel Download with 20 workers
    # This will 20x the speed of the current single-threaded export
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        executor.map(download_version, all_v)

    print("\n🏁 Master Table Export Finished!")

if __name__ == "__main__":
    main()
