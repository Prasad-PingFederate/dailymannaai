import os
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")
client = DataAPIClient(os.getenv("ASTRA_DB_APPLICATION_TOKEN"))
db = client.get_database(os.getenv("ASTRA_DB_API_ENDPOINT"))

candidates = [
    "bible_ru", "bible_v2_ru", "bible_ext_ru",
    "bible_ko", "bible_v2_ko", "bible_ext_ko",
    "bible_te", "bible_v2_te", "bible_ext_te",
    "bible_ta", "bible_v2_ta", "bible_ext_ta"
]

all_colls = db.list_collection_names()

for name in candidates:
    if name not in all_colls: continue
    coll = db.get_collection(name)
    try:
        # Test a filter query (this triggers SAI check)
        # We search for something that doesn't exist to see if it responds
        res = list(coll.find({"book": "GENESIS_TEST"}, limit=1))
        print(f"✅ {name}: HEALTHY")
    except Exception as e:
        print(f"❌ {name}: CORRUPTED ({str(e)[:100]})")
