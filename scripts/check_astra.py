import os
from astrapy import DataAPIClient
from dotenv import load_dotenv

load_dotenv(".env")
load_dotenv(".env.local")

token = os.getenv("ASTRA_DB_TOKEN")
endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")

print(f"Token present: {bool(token)}")
print(f"Endpoint present: {bool(endpoint)}")

if not token or not endpoint:
    print("❌ Credentials missing!")
    exit(1)

try:
    client = DataAPIClient(token)
    db = client.get_database(endpoint)
    print("✅ Connected to Astra DB!")
    
    print("\n--- Collections Available ---")
    collections = db.list_collection_names()
    for coll in collections:
        print(f"- {coll}")
    
    if "sermons" in collections:
        print("\nChecking 'sermons' collection...")
        coll = db.get_collection("sermons")
        count = len(list(coll.find({}, limit=1)))
        print(f"Found {count} sample documents in 'sermons'.")
    else:
        print("\n⚠️ 'sermons' collection not found.")
        
except Exception as e:
    print(f"❌ Error: {e}")
