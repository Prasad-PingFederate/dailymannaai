import os
import asyncio
from dotenv import load_dotenv
from azure.cosmos.aio import CosmosClient

async def find_logical_duplicates():
    load_dotenv(".env.local")
    conn = os.getenv("COSMOS_CONNECTION_STRING")
    
    async with CosmosClient.from_connection_string(conn) as client:
        db = client.get_database_client("BibleDatabase")
        container = db.get_container_client("verses")
        
        # We'll check one common translation as a sample
        version = "ENGKJV"
        print(f"🔍 Analyzing {version} for logical duplicates...")
        
        query = f"SELECT c.book, c.chapter, c.verse, c.id FROM c WHERE c.version = '{version}'"
        
        verses = {}
        duplicates = []
        
        async for item in container.query_items(query=query):
            # Key = book + chapter + verse
            key = f"{item['book']}_{item['chapter']}_{item['verse']}".lower()
            if key in verses:
                duplicates.append({
                    "verse": key,
                    "id1": verses[key],
                    "id2": item['id']
                })
            else:
                verses[key] = item['id']

        if duplicates:
            print(f"⚠️ Found {len(duplicates)} logical duplicates in {version}!")
            for d in duplicates[:5]:
                print(f"  - Verse: {d['verse']} | IDs: {d['id1']} AND {d['id2']}")
        else:
            print(f"✅ No logical duplicates found in {version}.")

if __name__ == "__main__":
    asyncio.run(find_logical_duplicates())
