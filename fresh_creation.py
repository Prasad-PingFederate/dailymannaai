import os
import time
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")
client = DataAPIClient(os.getenv("ASTRA_DB_APPLICATION_TOKEN"))
db = client.get_database(os.getenv("ASTRA_DB_API_ENDPOINT"))

def create_fresh(name):
    print(f"🏗️  Creating {name}...")
    if name in db.list_collection_names():
        db.drop_collection(name)
        time.sleep(10)
    db.create_collection(name)
    print(f"✅ Created {name}")
    time.sleep(5)

langs = ["ru", "ko", "te", "ta"]
for l in langs:
    create_fresh(f"bible_final_{l}")
