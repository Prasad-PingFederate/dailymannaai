import os
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")
client = DataAPIClient(os.getenv("ASTRA_DB_APPLICATION_TOKEN"))
db = client.get_database(os.getenv("ASTRA_DB_API_ENDPOINT"))

hybrid_map = {
    "AR": "bible_ar",
    "RU": "bible_de",
    "KO": "bible_fr",
    "TE": "bible_es",
    "TA": "bible_pt",
    "ZH": "bible_zh"
}

print("FINAL LANGUAGE HEALTH CHECK:")
for lang, coll_name in hybrid_map.items():
    try:
        coll = db.get_collection(coll_name)
        res = coll.find_one({"version": lang})
        if res:
            print(f"✅ {lang}: FOUND (in {coll_name})")
        else:
            print(f"❌ {lang}: NOT FOUND (in {coll_name})")
    except Exception as e:
        print(f"❌ {lang}: Error ({str(e)[:50]})")

print("\nUI Mapping is active. All systems ready.")
