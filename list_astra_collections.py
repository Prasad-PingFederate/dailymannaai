import os
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")
token    = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")

client = DataAPIClient(token)
db = client.get_database(endpoint, keyspace="default_keyspace")

print("=== All Collections in Astra DB ===")
collections = db.list_collection_names()
for cname in sorted(collections):
    print(f"{cname}")
