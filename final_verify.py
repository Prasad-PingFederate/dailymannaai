import os
import json
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv('.env.local')
token = os.getenv('ASTRA_DB_APPLICATION_TOKEN')
endpoint = os.getenv('ASTRA_DB_API_ENDPOINT')

client = DataAPIClient(token)
db = client.get_database_by_api_endpoint(endpoint)
coll = db.get_collection('bible_ar')

with open('refined_eligible.json', 'r') as f:
    eligible = json.load(f)

missing = []
print(f"Verifying final count for {len(eligible)} bibles...")

for b in eligible:
    vers = b['id'].upper()
    try:
        # Check for existence of at least one verse
        doc = coll.find_one({"version": vers}, projection={"_id": 1})
        if not doc:
            missing.append(b['id'])
    except:
        missing.append(b['id'])

print(f"\nRESULTS:")
print(f"Total in Catalog: {len(eligible)}")
print(f"Total Successfully in DB: {len(eligible) - len(missing)}")
print(f"Total Still Missing: {len(missing)}")

if missing:
    print(f"Missing IDs: {missing}")
else:
    print("MISSION ACCOMPLISHED: 100% of the catalog is now live in Astra DB.")
