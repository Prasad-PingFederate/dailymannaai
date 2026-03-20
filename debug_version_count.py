import os
import asyncio
from dotenv import load_dotenv
from azure.cosmos.aio import CosmosClient

async def check_version(v_code):
    load_dotenv(".env.local")
    conn = os.getenv("COSMOS_CONNECTION_STRING")
    async with CosmosClient.from_connection_string(conn) as client:
        container = client.get_database_client("BibleDatabase").get_container_client("verses")
        query = f"SELECT COUNT(1) FROM c WHERE c.version = '{v_code}'"
        results = container.query_items(query=query, enable_cross_partition_query=True)
        async for item in results:
            print(f"Version {v_code}: {item['$1']} records")

if __name__ == "__main__":
    asyncio.run(check_version("mpj"))
    asyncio.run(check_version("kkc"))
