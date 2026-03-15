import os
import io
import sys
from dotenv import load_dotenv
from astrapy import DataAPIClient

# Set encoding for better printing
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Use absolute path for .env.local
script_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(script_dir, ".env.local"))

client = DataAPIClient(os.getenv("ASTRA_DB_APPLICATION_TOKEN"))
db = client.get_database(os.getenv("ASTRA_DB_API_ENDPOINT"))

colls = db.list_collection_names()
print(f"Total collections: {len(colls)}")

def get_detailed_stats(coll_name):
    print(f"\n--- Stats for {coll_name} ---")
    coll = db.get_collection(coll_name)
    try:
        # Check total estimated count (Astra DB limit is 1000 for exact count)
        # We'll just check if it has entries for specific versions
        if coll_name == "bible_ar":
            # Sample some and count by version
            latest_docs = list(coll.find({}, limit=1000, projection={"version": 1}))
            versions = {}
            for d in latest_docs:
                v = d.get('version', 'UNKNOWN')
                versions[v] = versions.get(v, 0) + 1
            print(f"Versions found in sample: {versions}")
            
            # Check specific count for the new batch
            batch1 = ["SHR", "RIFA", "BEL", "LIN", "LUG", "NYA", "CEBULB", "HATBSA", "IBO", "SOM", "GAZ", "HAW1868", "ILOULB", "TON", "GUN", "KIK", "TWI", "CHK"]
            for v in batch1:
                try:
                    # Astra count_documents with filter is limited to 1000
                    c = coll.count_documents({"version": v}, upper_bound=1000)
                    print(f"  - {v}: {c}+ verses")
                except:
                    print(f"  - {v}: Over 1000")
        else:
            try:
                c = coll.count_documents({}, upper_bound=1000)
                print(f"Total: {c}+ verses")
            except:
                print(f"Total: Over 1000")
    except Exception as e:
        print(f"Error: {e}")

for name in ["bible_ar", "bible_translations"]:
    if name in colls:
        get_detailed_stats(name)
