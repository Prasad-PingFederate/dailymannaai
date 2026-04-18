
import os
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv("C:/Users/Infobell/.gemini/antigravity/scratch/dailymannaai/.env.local")

token = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")

client = DataAPIClient(token)
db = client.get_database(endpoint)

print(f"Checking endpoint: {endpoint}")

colls = db.list_collection_names()
print(f"Total collections found: {len(colls)}")

for name in sorted(colls):
    coll = db.get_collection(name)
    try:
        # Get count upper bound to avoid timeout
        count = coll.count_documents({}, upper_bound=1000000)
        print(f"[{name}] count: {count}")
        
        # Check if vectors exist in the first document
        doc = coll.find_one({})
        if doc and "$vector" in doc:
            print(f"  --> FOUND VECTORS in {name}")
    except Exception as e:
        print(f"[{name}] error: {e}")

# Check for the default embedding collection name explicitly if not in list
if "openai_embedding_collection" not in colls:
    print("\nChecking specifically for 'openai_embedding_collection'...")
    try:
        coll = db.get_collection("openai_embedding_collection")
        doc = coll.find_one({})
        if doc:
            print("  --> 'openai_embedding_collection' EXISTS but was not in list_collection_names (strange)!")
            if "$vector" in doc:
                print("      and it has VECTORS.")
    except:
        print("  --> 'openai_embedding_collection' truly does not exist under that name.")
