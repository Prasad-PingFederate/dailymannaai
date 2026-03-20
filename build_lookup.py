import os
import asyncio
import json
from dotenv import load_dotenv
from azure.cosmos.aio import CosmosClient

async def fetch_ids_for_version(container, version, result_list, sem):
    async with sem:
        try:
            query = f"SELECT c.id FROM c WHERE c.version = @v"
            parameters = [{"name": "@v", "value": version}]
            ids = []
            async for item in container.query_items(query=query, parameters=parameters):
                ids.append(item['id'])
            result_list.extend(ids)
            print(f"    - Found {len(ids):,} IDs for version {version}")
        except Exception as e:
            print(f"    ❌ Error for version {version}: {e}")

async def fetch_ids_parallel():
    load_dotenv(".env.local")
    conn = os.getenv("COSMOS_CONNECTION_STRING")
    
    DB_NAME = "BibleDatabase"
    CONTAINER_NAME = "verses"
    ID_FILE = "cosmos_existing_ids.txt"
    MAX_CONCURRENT_VERSIONS = 25 # Increase for faster lookup

    print(f"🚀 Initializing Super-Parallel Lookup (Target: 5.4M)...")
    
    async with CosmosClient.from_connection_string(conn) as client:
        container = client.get_database_client(DB_NAME).get_container_client(CONTAINER_NAME)
        
        print("🔍 Fetching unique versions from Cosmos...")
        versions_query = "SELECT DISTINCT c.version FROM c"
        versions = []
        async for v_item in container.query_items(query=versions_query):
            if v_item.get('version'):
                versions.append(v_item['version'])
        
        print(f"📦 Found {len(versions)} versions. Fetching IDs in parallel...")
        
        sem = asyncio.Semaphore(MAX_CONCURRENT_VERSIONS)
        all_ids = []
        tasks = [fetch_ids_for_version(container, v, all_ids, sem) for v in versions]
        await asyncio.gather(*tasks)
        
    print(f"💾 Saving {len(all_ids):,} IDs to {ID_FILE}...")
    with open(ID_FILE, "w", encoding="utf-8") as f:
        for vid in all_ids:
            f.write(vid + "\n")
            
    print(f"✅ Lookup Table Complete: {len(all_ids):,} IDs cached.")

if __name__ == "__main__":
    asyncio.run(fetch_ids_parallel())
