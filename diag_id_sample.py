import os
import asyncio
from azure.cosmos.aio import CosmosClient
from dotenv import load_dotenv

async def check_sample():
    load_dotenv(".env.local")
    conn_str = os.getenv("COSMOS_CONNECTION_STRING")
    client = CosmosClient.from_connection_string(conn_str)
    
    db = client.get_database_client("BibleDatabase")
    container = db.get_container_client("verses")

    print("--- Sampling Top 3 Verses for Genesis ---")
    query = "SELECT TOP 3 c.id, c.version, c.book FROM c WHERE c.book = 'Genesis'"
    async for item in container.query_items(query, enable_cross_partition_query=True):
        print(f"ID: {item['id']} | Version: {item['version']}")
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(check_sample())
