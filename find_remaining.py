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

print(f"Total Eligible: {len(eligible)}")

# Optimization: Get all versions from DB first (if possible)
# Actually, I'll just check a sample or do a targeted check
remaining = []
# We'll check from both ends to see where they meet
for item in eligible:
    bid = item['id'].upper()
    # This might be slow for 1129, but let's try a bulk check if we can
    # Or just check every 10th one to get a representative list
    pass

# Better approach: Get ALL versions in DB
print("Fetching all versions from DB...")
all_versions = set()
for doc in collection.find({}, projection={"version": True}):
    if "version" in doc:
        all_versions.add(doc["version"].upper())

print(f"Unique Versions in DB: {len(all_versions)}")

missing = [item for item in eligible if item['id'].upper() not in all_versions]
print(f"Bibles still missing from DB: {len(missing)}")

if missing:
    print("\nSome examples of what's left:")
    for m in missing[:20]:
        print(f"- {m['lang']} ({m['id']})")
