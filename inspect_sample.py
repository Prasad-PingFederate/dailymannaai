import os
import asyncio
import json
from dotenv import load_dotenv
from azure.cosmos.aio import CosmosClient

async def inspect_sample():
    load_dotenv(".env.local")
    conn = os.getenv("COSMOS_CONNECTION_STRING")
    
    async with CosmosClient.from_connection_string(conn) as client:
        db = client.get_database_client("BibleDatabase")
        container = db.get_container_client("verses")
        
        # Get one record
        query = "SELECT TOP 1 * FROM c"
        results = container.query_items(query=query)
        async for item in results:
            # Hide large data for display
            clean_item = {k: v for k, v in item.items() if k != 'vector' and k != 'embedding'}
            print(f"📄 Sample Record Structure:")
            print(json.dumps(clean_item, indent=2))
            if 'vector' in item or 'embedding' in item:
                 print(f"⚠️ Vector found: Size {len(item.get('vector', item.get('embedding')))}")

if __name__ == "__main__":
    asyncio.run(inspect_sample())
