import os
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")

client = DataAPIClient(os.getenv("ASTRA_DB_APPLICATION_TOKEN"))
db = client.get_database(os.getenv("ASTRA_DB_API_ENDPOINT"))
coll = db.get_collection("bible_ar")

print("Scanning for versions...")
versions = set()
count = 0
for doc in coll.find({}, limit=100000, projection={"version": 1}):
    v = doc.get("version")
    if v:
        versions.add(v)
    count += 1
    if count % 10000 == 0:
        print(f"Scanned {count} documents...")

print(f"Total unique versions found in first 100k: {len(versions)}")
print(f"Sample: {sorted(list(versions))[:50]}")
