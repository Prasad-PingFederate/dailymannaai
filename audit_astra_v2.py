
import os
import json
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv("C:/Users/Infobell/.gemini/antigravity/scratch/dailymannaai/.env.local")

token = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")

client = DataAPIClient(token)
db = client.get_database(endpoint)

colls = db.list_collection_names()
print(f"Audit of {len(colls)} collections:")

for name in sorted(colls):
    coll = db.get_collection(name)
    try:
        # Get one doc to see size and structure
        doc = coll.find_one({})
        if doc:
            doc_str = json.dumps(doc)
            size_bytes = len(doc_str.encode('utf-8'))
            print(f"[{name}]")
            print(f"  Sample Doc Size: ~{size_bytes} bytes")
            print(f"  Fields: {list(doc.keys())}")
            if "$vector" in doc:
                print("  Vector: YES")
            else:
                print("  Vector: NO")
        else:
            print(f"[{name}] Empty")
    except Exception as e:
        print(f"[{name}] Error: {e}")
