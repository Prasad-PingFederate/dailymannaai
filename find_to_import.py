import os
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")
token    = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")

client = DataAPIClient(token)
db = client.get_database(endpoint, keyspace="default_keyspace")

versions_in_db = set()

print("Scanning collections for languages...")
colls = db.list_collection_names()
for c in colls:
    if c.startswith("bible_") and c not in ["bible_translations", "bible_ar"]:
        versions_in_db.add(c.replace("bible_", "").upper())

# Scan bible_ar for versions
print("Sampling bible_ar for versions...")
if "bible_ar" in colls:
    col = db.get_collection("bible_ar")
    # Fetching in chunks to avoid timeout
    for i in range(10):
        docs = col.find({}, limit=1000, skip=i*1000, projection={"version": 1})
        for d in docs:
            v = d.get("version")
            if v:
                versions_in_db.add(v.upper())

print(f"Versions found in DB: {sorted(list(versions_in_db))}")

# Now compare with eligible_bibles.json
import json
with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\eligible_bibles.json", 'r') as f:
    eligible = json.load(f)

to_import = []
for item in eligible:
    if item['id'].upper() not in versions_in_db and item['lang'].upper() not in versions_in_db:
        to_import.append(item)

print(f"Bibles to import: {len(to_import)}")
with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\to_import.json", 'w') as f:
    json.dump(to_import, f, indent=2)

# Print first 20 to import
for item in to_import[:20]:
    print(f"  {item['id']} ({item['lang']})")
