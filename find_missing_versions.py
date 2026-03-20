import os
import glob
import json
import asyncio
from astrapy import DataAPIClient
from dotenv import load_dotenv

async def find_missing():
    load_dotenv(".env.local")
    # 1. Get List of Versions already completed locally
    done_files = glob.glob("export/*.json.done")
    completed_versions = set()
    for f in done_files:
        v_name = os.path.basename(f).replace(".json.done", "").upper()
        completed_versions.add(v_name)
    
    print(f"✅ Local 'Done' versions: {len(completed_versions)}")

    # 2. Get List of Versions from Astra DB (bible_ar collection)
    token = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
    endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")
    
    client = DataAPIClient(token)
    db = client.get_async_database_by_api_endpoint(endpoint)
    coll = db.get_collection("bible_ar")
    
    print("📡 Fetching all version codes from Astra (Batch Mode)...")
    all_astra_versions = set()
    
    # Using a cursor to safely find all distinct versions without a timeout
    cursor = coll.find({}, projection={"version": 1})
    
    count = 0
    new_found = 0
    async for doc in cursor:
        v = doc.get("version", "").upper()
        if v and v not in all_astra_versions:
            all_astra_versions.add(v)
            if v not in completed_versions:
                new_found += 1
                if new_found <= 5:
                    print(f"🔥 Found NEW Version in Astra: {v}")
        
        count += 1
        if count % 100000 == 0:
            print(f"Checked {count} Astra records... Found {len(all_astra_versions)} versions.")
            if len(all_astra_versions) > 1500: # Stop if we hit a wall
                break

    missing = all_astra_versions - completed_versions
    print(f"\n--- RESULTS ---")
    print(f"Total Versions in Astra: {len(all_astra_versions)}")
    print(f"Versions Missing from Cosmos: {len(missing)}")
    
    with open("missing_versions.json", "w", encoding="utf-8") as f:
        json.dump(list(missing), f)
    
    print("✅ Missing versions saved to 'missing_versions.json'")

if __name__ == "__main__":
    asyncio.run(find_missing())
