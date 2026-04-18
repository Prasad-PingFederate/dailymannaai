import os
import time
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")
client = DataAPIClient(os.getenv("ASTRA_DB_APPLICATION_TOKEN"))
db = client.get_database(os.getenv("ASTRA_DB_API_ENDPOINT"))

def safe_create(name):
    print(f"🛠️  Creating {name}...")
    try:
        db.create_collection(name)
        print(f"⏳ Verification pause (20s) for {name}...")
        time.sleep(20)
        if name in db.list_collection_names():
            print(f"✅ Verified: {name}")
            return True
        else:
            print(f"❌ Failed to verify {name} in list.")
            return False
    except Exception as e:
        print(f"💥 Error creating {name}: {e}")
        return False

langs = ["ru", "ko", "te", "ta"]
for l in langs:
    coll_name = f"bible_ext_{l}"
    if coll_name in db.list_collection_names():
        print(f"⏩ {coll_name} already exists.")
        continue
    
    safe_create(coll_name)

print("\n🏁 Collection setup finished.")
