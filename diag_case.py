import os
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")
client = DataAPIClient(os.getenv("ASTRA_DB_APPLICATION_TOKEN"))
db = client.get_database(os.getenv("ASTRA_DB_API_ENDPOINT"))
coll = db.get_collection("bible_ar")

print("Checking actual 'version' case for a few records...")
for doc in coll.find({}, limit=5):
    print(f"ID: {doc.get('_id')} | VERSION: {doc.get('version')}")
