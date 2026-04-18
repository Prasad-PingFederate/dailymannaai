import os
import asyncio
from dotenv import load_dotenv
from astrapy import DataAPIClient

async def get_all_astra_versions():
    load_dotenv(".env.local")
    token = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
    endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")
    
    client = DataAPIClient(token)
    db = client.get_async_database_by_api_endpoint(endpoint)
    coll = db.get_collection("bible_ar")
    
    print("Fetching unique versions from Astra...")
    # Using find() to iterate and collect unique versions if distinct() is slow or limited
    versions = set()
    cursor = coll.find({}, projection={"version": 1})
    count = 0
    async for doc in cursor:
        v = doc.get("version")
        if v: versions.add(v)
        count += 1
        if count % 100000 == 0:
            print(f"Processed {count:,} records, found {len(versions)} unique versions...")
            # We don't need to scan all 20M if we just want to see if there are more than 1129
            if len(versions) > 5000: break 
            
    print(f"Total unique versions found: {len(versions)}")
    with open("all_astra_versions.txt", "w", encoding="utf-8") as f:
        for v in sorted(versions):
            f.write(v + "\n")

if __name__ == "__main__":
    asyncio.run(get_all_astra_versions())
