import os
import time
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")
ASTRA_TOKEN    = os.getenv("ASTRA_DB_APPLICATION_TOKEN") or os.getenv("ASTRA_DB_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")
ASTRA_KEYSPACE = os.getenv("ASTRA_DB_NAMESPACE") or "default_keyspace"

def deep_clean():
    client = DataAPIClient(ASTRA_TOKEN)
    db = client.get_database(ASTRA_ENDPOINT, keyspace=ASTRA_KEYSPACE)
    langs = ["ru", "ko", "te", "ta"]
    
    for l in langs:
        name = f"bible_{l}"
        print(f"🧹 Cleaning {name}...")
        while name in db.list_collection_names():
            try:
                db.drop_collection(name)
                print(f"   Requested drop for {name}")
            except Exception as e:
                print(f"   Drop error: {e}")
            time.sleep(10)
            
    print("✅ All target collections are gone.")

if __name__ == "__main__":
    deep_clean()
