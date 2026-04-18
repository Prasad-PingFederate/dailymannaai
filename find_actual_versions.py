import os
import asyncio
from azure.cosmos.aio import CosmosClient
from dotenv import load_dotenv

async def discover_versions():
    load_dotenv(".env.local")
    conn_str = os.getenv("COSMOS_CONNECTION_STRING")
    client = CosmosClient.from_connection_string(conn_str)
    
    db = client.get_database_client("BibleDatabase")
    container = db.get_container_client("verses")

    print("\n🔍 DISCOVERING ACTUAL VERSION CODES...")
    # SQL Queries work differently than SDK calls - putting cross-partition logic here
    query = "SELECT DISTINCT VALUE c.version FROM c"
    
    versions = []
    try:
        # Cross partition query is enabled by default in latest aio SDK 
        items = container.query_items(query, enable_cross_partition_query=True)
        async for v_code in items:
            versions.append(v_code)
            
        print(f"✅ Found {len(versions)} unique versions in Cosmos DB.")
        
        # Filtering for our targets
        targets = ['HIN', 'TEL', 'TAM', 'KJV', 'NIV', 'ENG']
        matches = [v for v in versions if any(t in v.upper() for t in targets)]
        
        print("\n--- USE THESE EXACT CODES IN YOUR COSMOS QUERY ---")
        for m in sorted(matches):
            print(f"👉 \"{m}\"")
                
    except Exception as e:
        print(f"❌ SDK Query failed: {e}")
        print("💡 Trying a different method...")
        # Fallback to a single-record sample to see formatting
        async for item in container.query_items("SELECT TOP 1 * FROM c", enable_cross_partition_query=True):
            print(f"Sample Record Version Code format: \"{item['version']}\"")
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(discover_versions())
