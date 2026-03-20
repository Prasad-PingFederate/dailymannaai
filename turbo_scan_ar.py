import os
from dotenv import load_dotenv
from astrapy import DataAPIClient

# Setup
load_dotenv(".env.local")
ASTRA_TOKEN = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")

client = DataAPIClient(ASTRA_TOKEN)
db = client.get_database(ASTRA_ENDPOINT)
coll = db.get_collection("bible_ar")

print("🔍 Pulling unique versions from bible_ar (Turbo Discovery)...")
# Since Astra doesn't have a fast 'distinct' on huge tables, 
# we'll just grab the first few thousand to see what we're dealing with.
versions = set()
for doc in coll.find({}, limit=10000):
    v = doc.get("version")
    if v:
        versions.add(v)

print(f"✅ Found {len(versions)} versions in the first 10,000 records.")
print(f"📋 Sample: {list(versions)[:20]}")
