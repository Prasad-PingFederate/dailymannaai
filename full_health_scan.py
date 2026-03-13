import os
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")
client = DataAPIClient(os.getenv("ASTRA_DB_APPLICATION_TOKEN"))
db = client.get_database(os.getenv("ASTRA_DB_API_ENDPOINT"))

colls = sorted(db.list_collection_names())
print(f"Total collections: {len(colls)}")

healthy = []
for name in colls:
    coll = db.get_collection(name)
    try:
        # Filtered find to check indexing
        list(coll.find({"book": "TEST"}, limit=1))
        print(f"✅ {name}")
        healthy.append(name)
    except Exception as e:
        print(f"❌ {name}")

print(f"\nHEALTHY LIST: {healthy}")
