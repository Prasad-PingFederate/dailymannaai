import os
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")
token    = os.getenv("ASTRA_DB_APPLICATION_TOKEN") or os.getenv("ASTRA_DB_TOKEN")
endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")

client = DataAPIClient(token)
db = client.get_database(endpoint, keyspace="default_keyspace")
col = db.get_collection("bible_nkjv")

books = col.distinct("book")
print(f"Total Books Found in DB: {len(books)}")
print(f"List of Books: {', '.join(sorted(books))}")

count = col.count_documents({})
print(f"Total Verses in DB: {count}")

if len(books) == 66:
    print("\n✅ Verification SUCCESS: All 66 NKJV books are present.")
else:
    print(f"\n❌ Verification FAILED: Found {len(books)} books instead of 66.")
