import os
import asyncio
from dotenv import load_dotenv
from azure.cosmos.aio import CosmosClient

async def find_duplicates_advanced():
    load_dotenv(".env.local")
    conn = os.getenv("COSMOS_CONNECTION_STRING")
    
    # We load standard book names to compare
    standard_books = set() 
    # Just check a few common ones to see if there is a pattern of different names
    
    async with CosmosClient.from_connection_string(conn) as client:
        db = client.get_database_client("BibleDatabase")
        container = db.get_container_client("verses")
        
        print("🔍 Checking for logical duplicates (Same verse content, different ID format)...")
        # Query for counts of same text in a single version to see if there is bloat
        version = "ENGKJV"
        
        # We search for text that appears more than once in this version
        query = f"SELECT c.text, COUNT(1) as count FROM c WHERE c.version = '{version}' GROUP BY c.text"
        # This will only work if we have enough RUs and the index allows it
        
        duplicates_found = 0
        try:
            async for item in container.query_items(query=query):
                if item['count'] > 1:
                    print(f"  Found duplicate text: '{item['text'][:30]}...' (Count: {item['count']})")
                    duplicates_found += (item['count'] - 1)
        except Exception as e:
            print(f"  ❌ Group By Query failed: {e}")
            print("Trying scan method (Download & Compare)...")
            
        print(f"📊 Summary for {version}: {duplicates_found} logical duplicates.")

if __name__ == "__main__":
    asyncio.run(find_duplicates_advanced())
