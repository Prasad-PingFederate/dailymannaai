import os
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")

client = DataAPIClient(os.getenv("ASTRA_DB_APPLICATION_TOKEN"))
db = client.get_database(os.getenv("ASTRA_DB_API_ENDPOINT"))
coll = db.get_collection("bible_ar")

print("Checking versions later in the DB...")
versions = set()
# Skip some to see what's further down
for doc in coll.find({}, limit=50000, skip=5000000, projection={"version": 1}):
    v = doc.get("version")
    if v:
        versions.add(v)

print(f"Versions found at skip 5M: {sorted(list(versions))}")
