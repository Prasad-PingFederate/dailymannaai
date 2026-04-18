import os
import asyncio
from dotenv import load_dotenv
from astrapy import DataAPIClient
from azure.cosmos.aio import CosmosClient

async def check_comparison():
    load_dotenv(".env.local")
    
    # Astra
    token = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
    endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")
    
    # Cosmos
    conn = os.getenv("COSMOS_CONNECTION_STRING")
    
    version = "ENGKJV"
    
    # 1. Astra Count for Version
    print(f"📡 Astra DB Query for {version}...")
    client = DataAPIClient(token)
    db = client.get_async_database_by_api_endpoint(endpoint)
    coll = db.get_collection("bible_ar")
    astra_count = await coll.count_documents({"version": version}, upper_bound=100000)
    print(f"📊 Astra: {astra_count:,} verses.")
    
    # 2. Cosmos Count for Version
    print(f"🌌 Cosmos DB Query for {version}...")
    async with CosmosClient.from_connection_string(conn) as c_client:
        c_db = c_client.get_database_client("BibleDatabase")
        container = c_db.get_container_client("verses")
        
        # Manually counting to avoid aggregation errors
        cosmos_count = 0
        async for item in container.query_items(query=f"SELECT c.id FROM c WHERE c.version = '{version}'"):
            cosmos_count += 1
        print(f"📊 Cosmos: {cosmos_count:,} verses.")

if __name__ == "__main__":
    asyncio.run(check_comparison())
