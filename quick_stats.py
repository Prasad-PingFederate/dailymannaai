import os
from dotenv import load_dotenv
from astrapy import DataAPIClient

# Use absolute path for .env.local
script_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(script_dir, ".env.local"))

client = DataAPIClient(os.getenv("ASTRA_DB_APPLICATION_TOKEN"))
db = client.get_database(os.getenv("ASTRA_DB_API_ENDPOINT"))

colls = sorted(db.list_collection_names())
print(f"Total collections: {len(colls)}")

for name in colls:
    coll = db.get_collection(name)
    try:
        count = coll.count_documents({}, upper_bound=10)
        print(f"[{name}] count: {count}+")
    except Exception as e:
        print(f"[{name}] error: {e}")
