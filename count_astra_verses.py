import os
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")
token = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")

client = DataAPIClient(token)
db = client.get_database(endpoint)

colls = db.list_collection_names()
bible_colls = sorted([c for c in colls if c.startswith("bible_")])

print(f"Checking {len(bible_colls)} bible collections...")
grand_total = 0

for name in bible_colls:
    coll = db.get_collection(name)
    try:
        # Astra Data API count is fast for small/medium collections
        # but for massive ones it might be slow.
        count = coll.estimated_document_count()
        print(f"  {name}: {count} verses")
        grand_total += count
    except Exception as e:
        print(f"  {name}: Error counting: {e}")

print(f"\nGRAND TOTAL VERSES IN ASTRA: {grand_total}")
