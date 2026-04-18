import os
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")
token    = os.getenv("ASTRA_DB_APPLICATION_TOKEN") or os.getenv("ASTRA_DB_TOKEN")
endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")

client = DataAPIClient(token)
db = client.get_database(endpoint, keyspace="default_keyspace")
col = db.get_collection("bible_kjv")

count = col.count_documents({})
print(f"Total KJV Verses: {count}")

books = col.distinct("book")
print(f"Total KJV Books: {len(books)}")
print(f"Sample Books: {sorted(books)[:10]}")
