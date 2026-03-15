import os
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")
token    = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")

client = DataAPIClient(token)
db = client.get_database(endpoint, keyspace="default_keyspace")

print("\n=== Sampling bible_translations ===")
col = db.get_collection("bible_translations")
docs = list(col.find({}, limit=50))
versions = set()
for d in docs:
    v = d.get("version")
    if v:
        versions.add(v)
print(f"Versions in sample: {versions}")

# If we find many versions, let's list some titles
for d in docs[:5]:
    print(f"  - {d.get('book')} {d.get('chapter')}:{d.get('verse')} ({d.get('version')})")
