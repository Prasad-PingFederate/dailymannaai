import os
import time
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")
client = DataAPIClient(os.getenv("ASTRA_DB_APPLICATION_TOKEN"))
db = client.get_database(os.getenv("ASTRA_DB_API_ENDPOINT"))

critical = ["bible_kjv", "bible_niv", "bible_nkjv", "bible_ar", "bible_de", "bible_es", "bible_fr", "bible_id", "bible_pt", "bible_zh", "sermons_archive"]

all_colls = db.list_collection_names()
to_drop = [c for c in all_colls if c not in critical]

print(f"Total collections: {len(all_colls)}")
print(f"Dropping {len(to_drop)} junk collections...")

for name in to_drop:
    print(f"🔥 Dropping {name}...")
    try:
        db.drop_collection(name)
    except Exception as e:
        print(f"   Error: {e}")
    time.sleep(2)

print("\nWaiting for database to settle...")
time.sleep(20)
print(f"Current count: {len(db.list_collection_names())}")
