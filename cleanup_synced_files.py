import os
import asyncio
import json
from dotenv import load_dotenv
from azure.cosmos.aio import CosmosClient

async def get_cosmos_versions():
    load_dotenv(".env.local")
    conn = os.getenv("COSMOS_CONNECTION_STRING")
    if not conn:
        print("COSMOS_CONNECTION_STRING not found.")
        return set()

    DB_NAME = "BibleDatabase"
    CONTAINER_NAME = "verses"

    async with CosmosClient.from_connection_string(conn) as client:
        db = client.get_database_client(DB_NAME)
        container = db.get_container_client(CONTAINER_NAME)
        
        print("Fetching unique versions from Cosmos DB...")
        # Using a query to get unique versions. This might be slow if there are millions of records.
        # But cross-partition is enabled by default.
        query = "SELECT DISTINCT c.version FROM c"
        results = container.query_items(query=query)
        
        versions = set()
        async for item in results:
            v = item.get("version")
            if v:
                versions.add(v.upper())
        
        return versions

def cleanup_export(existing_versions):
    EXPORT_DIR = "export"
    BACKUP_DIR = "processed_backup"
    
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
        
    print(f"Found {len(existing_versions)} versions in Cosmos.")
    
    count_moved = 0
    files = [f for f in os.listdir(EXPORT_DIR) if f.endswith(".json") and not f.endswith(".done")]
    
    for f in files:
        # Assuming filename is version.json
        version_code = f.replace(".json", "").upper()
        if version_code in existing_versions:
            # Move to backup
            src = os.path.join(EXPORT_DIR, f)
            dst = os.path.join(BACKUP_DIR, f)
            
            # Also move .done if exists (though we filtered for non-done)
            os.rename(src, dst)
            count_moved += 1
            print(f"  [ALREADY IN COSMOS] Moved {f}")

    print(f"\nMoved {count_moved} files to {BACKUP_DIR}")
    print(f"Remaining files in export: {len(os.listdir(EXPORT_DIR)) - len([x for x in os.listdir(EXPORT_DIR) if x.endswith('.done')])}")

async def main():
    versions = await get_cosmos_versions()
    cleanup_export(versions)

if __name__ == "__main__":
    asyncio.run(main())
