import os
import asyncio
import json
from dotenv import load_dotenv
from astrapy import DataAPIClient

async def find_new_astra_versions():
    load_dotenv(".env.local")
    token = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
    endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")
    
    # 1. Load eligible versions we already know about
    with open("refined_eligible.json", "r", encoding="utf-8") as f:
        known = {item["id"].upper() for item in json.load(f) if item.get("id")}
    
    print(f"Known versions in refined_eligible: {len(known)}")
    
    # 2. Fetch all versions from Astra
    client = DataAPIClient(token)
    db = client.get_async_database_by_api_endpoint(endpoint)
    coll = db.get_collection("bible_ar")
    
    print("Fetching unique versions from Astra (this may take a while)...")
    astra_versions = await coll.distinct("version")
    astra_set = {v.upper() for v in astra_versions if v}
    print(f"Total versions in Astra: {len(astra_set)}")
    
    # 3. Find missing
    missing = astra_set - known
    print(f"Versions in Astra NOT in refined_eligible: {len(missing)}")
    
    if missing:
        print("First 20 missing versions:", list(missing)[:20])
        with open("new_versions_found.json", "w", encoding="utf-8") as f:
            json.dump(list(missing), f)
            
if __name__ == "__main__":
    asyncio.run(find_new_astra_versions())
