import os
import asyncio
from azure.cosmos.aio import CosmosClient
from dotenv import load_dotenv
import json

DATABASE_NAME = "BibleDatabase"
CONTAINER_NAME = "verses"

async def main():
    load_dotenv(".env.local")
    conn_str = os.getenv("COSMOS_CONNECTION_STRING")
    client = CosmosClient.from_connection_string(conn_str)
    database = client.get_database_client(DATABASE_NAME)
    container = database.get_container_client(CONTAINER_NAME)
    
    # Get all distinct versions
    query = "SELECT DISTINCT c.version FROM c"
    versions = []
    async for item in container.query_items(query=query, enable_cross_partition_query=True):
        versions.append(item['version'])
    
    print(f"Found {len(versions)} unique versions in Cosmos DB.")
    
    check_versions = ["CTUBL", "KYG", "CESLB", "CESNKB", "ISL", "KGF", "SSD", "DWW", "PCK", "CES1613"]
    
    for v in check_versions:
        # Count total
        q_count = f"SELECT VALUE COUNT(1) FROM c WHERE c.version = '{v}'"
        count = 0
        async for c in container.query_items(query=q_count, enable_cross_partition_query=True):
            count = c
            break
            
        # Count OT vs NT
        # Assuming book name logic: Genesis-Malachi vs Matthew-Revelation
        # This is simplified: check if 'Genesis' or 'John' exist
        q_gen = f"SELECT VALUE COUNT(1) FROM c WHERE c.version = '{v}' AND c.book = 'Genesis'"
        gen_count = 0
        async for c in container.query_items(query=q_gen, enable_cross_partition_query=True):
            gen_count = c
            break
            
        print(f"[{v}] Total: {count} | Genesis: {gen_count} {'(Has OT)' if gen_count > 0 else '(NT Only?)'}")

    await client.close()

if __name__ == "__main__":
    asyncio.run(main())
