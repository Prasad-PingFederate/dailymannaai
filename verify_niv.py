import os
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")
token    = os.getenv("ASTRA_DB_APPLICATION_TOKEN") or os.getenv("ASTRA_DB_TOKEN")
endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")

client = DataAPIClient(token)
db = client.get_database(endpoint, keyspace="default_keyspace")
col = db.get_collection("bible_niv")

print("=== Sample verses from Astra DB → bible_niv ===\n")
docs = list(col.find({}, limit=5, projection={"book":1,"chapter":1,"verse":1,"text":1}))
for d in docs:
    book    = d.get("book","?")
    chapter = d.get("chapter","?")
    verse   = d.get("verse","?")
    text    = d.get("text","")[:70]
    print(f"  {book} {chapter}:{verse}  →  {text}...")

print()

# spot checks
for check_book in ["Genesis", "Psalms", "Matthew", "John", "Revelation"]:
    results = list(col.find({"book": check_book}, limit=1))
    status  = "✅ found" if results else "❌ NOT found"
    print(f"  {check_book:20s} {status}")

print()
print("=== All Collections in Astra DB ===")
for cname in db.list_collection_names():
    print(f"  - {cname}")
