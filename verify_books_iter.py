import os
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")
token    = os.getenv("ASTRA_DB_APPLICATION_TOKEN") or os.getenv("ASTRA_DB_TOKEN")
endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")

client = DataAPIClient(token)
db = client.get_database(endpoint, keyspace="default_keyspace")
col = db.get_collection("bible_nkjv")

book_set = set()
for doc in col.find({}, projection={"book": 1}):
    book_set.add(doc.get("book"))

print(f"Total Books Found in DB: {len(book_set)}")
print(f"Total Verses: {col.count_documents({})}")

if len(book_set) == 66:
    print("\n✅ Verification SUCCESS: All 66 NKJV books are present.")
else:
    print(f"\n❌ Verification FAILED: Found {len(book_set)} books.")
    missing_books = [b for b in book_set if b is None] # just in case
    print(f"Books found: {sorted(list(book_set))}")
