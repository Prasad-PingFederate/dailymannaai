import os
import json
import concurrent.futures
from dotenv import load_dotenv
from astrapy import DataAPIClient
import upload_json_to_cosmos # Import our upload logic

# 1. Setup
load_dotenv(".env.local")
ASTRA_TOKEN = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")

client = DataAPIClient(ASTRA_TOKEN)
db = client.get_database(ASTRA_ENDPOINT)

# Initialize Cosmos DB once
print("🛡️ Initializing Cosmos DB Connection...")
cosmos_container = upload_json_to_cosmos.setup_cosmos()

def export_and_upload(coll_name):
    try:
        output_file = f"{coll_name}_export.json"
        
        # --- PHASE 1: EXPORT ---
        if not os.path.exists(output_file):
            print(f"🚀 [EXPORT] Starting {coll_name}...")
            coll = db.get_collection(coll_name)
            count = 0
            with open(output_file, 'w', encoding='utf-8') as f:
                for doc in coll.find({}):
                    if "_id" in doc: del doc["_id"]
                    f.write(json.dumps(doc, ensure_ascii=False) + "\n")
                    count += 1
                    if count % 10000 == 0:
                        print(f"  📦 {coll_name}: {count} records exported...")
            print(f"✅ [EXPORT DONE] {coll_name}: {count} records.")
        else:
            print(f"⏩ [EXPORT SKIP] {output_file} already exists.")

        # --- PHASE 2: UPLOAD ---
        print(f"☁️ [UPLOAD] Starting {coll_name} to Cosmos DB...")
        upload_json_to_cosmos.upload_file(output_file, cosmos_container)
        print(f"✨ [FULL COMPLETE] {coll_name} is now in Azure!")
        
        return True
    except Exception as e:
        print(f"❌ [ERROR] {coll_name}: {e}")
        return False

def main():
    # Get all collections
    all_colls = db.list_collection_names()
    targets = [c for c in all_colls if c.startswith("bible_") or c.startswith("sermons_")]
    
    # Exclude bible_ar as it's handled by the dedicated long-running fast_export_astra.py
    targets = [t for t in targets if t != "bible_ar"]
    
    # Sort targets by name (or we could sort by size if we had it)
    targets.sort()

    print(f"🔄 Starting Continuous Migration for {len(targets)} collections.")
    print(f"⚡ Parallel workers: 5")

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        executor.map(export_and_upload, targets)

    print("\n🏁 All background migrations finished!")

if __name__ == "__main__":
    main()
