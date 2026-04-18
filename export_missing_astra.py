import os
import json
import asyncio
from astrapy import DataAPIClient
from dotenv import load_dotenv

async def export_missing():
    load_dotenv(".env.local")
    token = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
    endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")
    
    client = DataAPIClient(token)
    db = client.get_async_database_by_api_endpoint(endpoint)
    coll = db.get_collection("bible_ar")
    
    # Read the missing versions list
    if not os.path.exists("versions_to_export.txt"):
        print("Versions list missing!")
        return
        
    with open("versions_to_export.txt", "r") as f:
        missing_versions = [line.strip().upper() for line in f if line.strip()]

    print(f"🚀 Starting export for {len(missing_versions)} missing versions...")

    # Semaphore to prevent overloading Astra (though it handles concurrency well)
    sem = asyncio.Semaphore(10)

    async def export_version(v_code):
        async with sem:
            out_file = f"export/{v_code.lower()}.json"
            if os.path.exists(out_file) or os.path.exists(out_file + ".done"):
                print(f"Skipping {v_code} (Already exists)")
                return

            print(f"📡 Exporting {v_code}...")
            count = 0
            try:
                # Direct lookup by version field
                cursor = coll.find({"version": v_code})
                
                with open(out_file, 'w', encoding='utf-8') as f:
                    async for doc in cursor:
                        # Clean Astra system fields before saving
                        if "_id" in doc: del doc["_id"]
                        f.write(json.dumps(doc, ensure_ascii=False) + "\n")
                        count += 1
                
                if count > 0:
                    print(f"✅ {v_code} COMPLETE ({count} verses)")
                else:
                    print(f"⚠️ {v_code} EMPTY - check mapping.")
                    if os.path.exists(out_file): os.remove(out_file)
            except Exception as e:
                print(f"❌ Error exporting {v_code}: {e}")

    # Process in batches to maintain flow
    tasks = [export_version(v) for v in missing_versions]
    await asyncio.gather(*tasks)
    print("\n🏁 ALL MISSING VERSIONS EXPORTED!")

if __name__ == "__main__":
    asyncio.run(export_missing())
