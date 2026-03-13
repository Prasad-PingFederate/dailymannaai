import os
import time
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")
ASTRA_TOKEN    = os.getenv("ASTRA_DB_APPLICATION_TOKEN") or os.getenv("ASTRA_DB_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")
ASTRA_KEYSPACE = os.getenv("ASTRA_DB_NAMESPACE") or "default_keyspace"

def hard_reset_collections():
    client = DataAPIClient(ASTRA_TOKEN)
    db = client.get_database(ASTRA_ENDPOINT, keyspace=ASTRA_KEYSPACE)
    
    target_langs = ["ar", "ru", "ko", "te", "ta"]
    
    for lang in target_langs:
        coll_name = f"bible_{lang}"
        print(f"🔥 Attempting to drop '{coll_name}'...")
        try:
            db.drop_collection(coll_name)
            print(f"✅ Dropped '{coll_name}'. Waiting 10s...")
            time.sleep(10)
        except Exception as e:
            print(f"⚠️  Error dropping '{coll_name}': {e}")

    print("\n🏁 Hard reset complete. Now run the import script.")

if __name__ == "__main__":
    hard_reset_collections()
