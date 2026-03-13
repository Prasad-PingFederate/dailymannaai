import os
import time
from dotenv import load_dotenv
from astrapy import DataAPIClient

# ── Load credentials ──────────────────────────────
load_dotenv(".env.local")

ASTRA_TOKEN    = os.getenv("ASTRA_DB_APPLICATION_TOKEN") or os.getenv("ASTRA_DB_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")
ASTRA_KEYSPACE = os.getenv("ASTRA_DB_NAMESPACE") or "default_keyspace"

def drop_and_verify():
    client = DataAPIClient(ASTRA_TOKEN)
    db = client.get_database(ASTRA_ENDPOINT, keyspace=ASTRA_KEYSPACE)
    
    targets = ["bible_ru", "bible_ko", "bible_te", "bible_ta", "bible_ar"]
    for coll in targets:
        print(f"Checking {coll}...")
        if coll in db.list_collection_names():
            print(f"Dropping {coll}...")
            try:
                db.drop_collection(coll)
            except Exception as e:
                print(f"Error dropping {coll}: {e}")
            time.sleep(5)
    
    print("\nWaiting for collections to completely vanish...")
    for i in range(12):
        time.sleep(10)
        current = db.list_collection_names()
        remaining = [c for c in targets if c in current]
        if not remaining:
            print("✅ All target collections successfully deleted from database.")
            return
        print(f"Still waiting on: {remaining}")
        
    print("❌ Timed out waiting for collections to delete.")

if __name__ == "__main__":
    drop_and_verify()
