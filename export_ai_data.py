import os
import json
import asyncio
from astrapy import DataAPIClient
from dotenv import load_dotenv

async def export_ai_collections():
    load_dotenv(".env.local")
    token = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
    endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")
    
    if not token or not endpoint:
        print("❌ Astra Credentials missing!")
        return

    client = DataAPIClient(token)
    db = client.get_async_database_by_api_endpoint(endpoint)
    
    targets = ["sermons", "christian_news", "openai_embedding_collection"]
    
    if not os.path.exists("export"):
        os.makedirs("export")

    for coll_name in targets:
        out_file = f"export/{coll_name}.json"
        
        try:
            coll = db.get_collection(coll_name)
            print(f"\n📡 Starting Export: {coll_name}...")
            
            # Use projection to get ALL fields, importantly including $vector for embeddings
            cursor = coll.find({})
            count = 0
            
            with open(out_file, 'w', encoding='utf-8') as f:
                async for doc in cursor:
                    # Map Astra's _id to Cosmos DB's required 'id' string field
                    if "_id" in doc:
                        doc["id"] = str(doc.pop("_id"))
                    else:
                        doc["id"] = f"{coll_name}_{count}"
                    
                    # Astra stores embeddings in '$vector', Cosmos DB NoSQL expects standard array keys.
                    # We will map '$vector' -> 'vector' so Cosmos DB can index it easily.
                    if "$vector" in doc:
                        doc["vector"] = doc.pop("$vector")

                    f.write(json.dumps(doc, ensure_ascii=False) + "\n")
                    count += 1
                    
                    if count % 1000 == 0:
                        print(f"  📦 {coll_name}: {count} records exported...")
            
            if count > 0:
                print(f"✅ {coll_name} COMPLETE ({count} records saved to {out_file})")
            else:
                print(f"⚠️ {coll_name} was EMPTY.")
                if os.path.exists(out_file): os.remove(out_file)
                
        except Exception as e:
            print(f"❌ Error fetching {coll_name}: {e}")

    print("\n🏁 ALL AI & SERMON DATA EXPORTED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(export_ai_collections())
