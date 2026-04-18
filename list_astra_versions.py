import os
import asyncio
from dotenv import load_dotenv
from astrapy import DataAPIClient

async def list_astra_versions():
    load_dotenv(".env.local")
    token = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
    endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")
    
    client = DataAPIClient(token)
    db = client.get_async_database_by_api_endpoint(endpoint)
    # The collection name might be bible_ar
    coll = db.get_collection("bible_ar")
    
    print("📡 Showing 20 random versions from Astra...")
    cursor = coll.find({}, projection={"version": 1}, limit=100)
    versions = set()
    async for doc in cursor:
        v = doc.get("version")
        if v: versions.add(v)
    print(f"Versions found: {list(versions)[:20]}")

if __name__ == "__main__":
    asyncio.run(list_astra_versions())
