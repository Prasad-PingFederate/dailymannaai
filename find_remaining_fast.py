import os
import json
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")

endpoint = os.environ.get("ASTRA_DB_API_ENDPOINT")
token = os.environ.get("ASTRA_DB_APPLICATION_TOKEN")
client = DataAPIClient(token)
db = client.get_database_by_api_endpoint(endpoint)
collection = db.get_collection("bible_ar")

with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\refined_eligible.json", 'r') as f:
    eligible = json.load(f)

print(f"Total Eligible Candidates: {len(eligible)}")

print("Scanning Astra DB for existing versions...")
all_versions = set(v.upper() for v in collection.distinct("version"))
print(f"Unique Versions currently in DB: {len(all_versions)}")

missing = [item for item in eligible if item['id'].upper() not in all_versions]
print(f"Bibles still remaining to be imported: {len(missing)}")

if missing:
    print("\nRepresentative Examples of Remaining Languages:")
    # Show bibles from the "middle" of the list since we processed ends
    middle_idx = len(missing) // 2
    for m in missing[max(0, middle_idx-10):middle_idx+10]:
        print(f"• {m['lang']} ({m['id']})")
else:
    print("All eligible languages have been imported!")
