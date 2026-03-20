import os
import asyncio
from azure.cosmos.aio import CosmosClient
from dotenv import load_dotenv

async def fetch_verse():
    load_dotenv(".env.local")
    conn_str = os.getenv("COSMOS_CONNECTION_STRING")
    client = CosmosClient.from_connection_string(conn_str)
    
    db = client.get_database_client("BibleDatabase")
    container = db.get_container_client("verses")

    # Change these to test different verses
    BOOK = "John"
    CHAPTER = 1
    VERSE = 1
    VERSION = "KJV" # This is your Partition Key
    
    # Method 1: Point Read (Ultra Fast & 1 RU)
    # The ID format we used: Book_Chapter_Verse_Version
    target_id = f"{BOOK}_{CHAPTER}_{VERSE}_{VERSION}"
    
    try:
        print(f"--- Fetching {target_id} ---")
        item = await container.read_item(item=target_id, partition_key=VERSION)
        print(f"[{item['version']}] {item['book']} {item['chapter']}:{item['verse']}")
        print(f"Content: {item['text']}")
    except Exception as e:
        print(f"Verse not found: {e}")
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(fetch_verse())
