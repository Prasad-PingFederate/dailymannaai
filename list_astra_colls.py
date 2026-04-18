import os
import asyncio
from dotenv import load_dotenv
from astrapy import DataAPIClient

async def list_colls():
    load_dotenv(".env.local")
    token = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
    endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")
    
    client = DataAPIClient(token)
    db = client.get_async_database_by_api_endpoint(endpoint)
    
    print("Listing collections in Astra DB...")
    colls = await db.list_collections()
    for c in colls:
        print(f"Collection: {c.name}")

if __name__ == "__main__":
    asyncio.run(list_colls())
