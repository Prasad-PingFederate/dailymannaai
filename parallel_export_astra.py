import os
import json
import concurrent.futures
from dotenv import load_dotenv
from astrapy import DataAPIClient

# 1. Setup
load_dotenv(".env.local")
ASTRA_TOKEN = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")

client = DataAPIClient(ASTRA_TOKEN)
db = client.get_database(ASTRA_ENDPOINT)

def export_collection(coll_name):
    try:
        print(f"🚀 [START] Exporting {coll_name}...")
        coll = db.get_collection(coll_name)
        
        output_file = f"{coll_name}_export.json"
        
        # Check if file already exists to avoid duplicate work
        if os.path.exists(output_file):
            print(f"⚠️  {coll_name}_export.json already exists. Skipping.")
            return True

        count = 0
        with open(output_file, 'w', encoding='utf-8') as f:
            for doc in coll.find({}):
                if "_id" in doc: del doc["_id"]
                f.write(json.dumps(doc, ensure_ascii=False) + "\n")
                count += 1
                if count % 10000 == 0:
                    print(f"  📦 {coll_name}: {count} records...")
                    
        print(f"✅ [DONE] {coll_name}: {count} total records.")
        return True
    except Exception as e:
        print(f"❌ [ERROR] {coll_name}: {e}")
        return False

def main():
    # 2. Get list of all collections
    all_colls = db.list_collection_names()
    
    # Filter for Bible and Sermon tables as seen in your screenshot
    targets = [c for c in all_colls if c.startswith("bible_") or c.startswith("sermons_")]
    
    # EXCLUDE bible_ar if it's already running in your other terminal
    # (Since it has 20M rows, we don't want to start it twice)
    targets = [t for t in targets if t != "bible_ar"]
    
    print(f"📡 Found {len(targets)} collections to download in parallel (excluding bible_ar).")
    print(f"📋 Targets: {targets}")
    
    # 3. Use ThreadPoolExecutor for parallel downloads
    # We use 5 workers as per your previous parallel request
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        executor.map(export_collection, targets)

    print("\n🏁 Parallel Download Task Finished!")

if __name__ == "__main__":
    main()
