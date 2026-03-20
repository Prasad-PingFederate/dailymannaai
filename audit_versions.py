import os
import json
import time
import concurrent.futures
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")

ASTRA_TOKEN = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")
EXPORT_DIR = "export"

def check_version(v_code):
    client = DataAPIClient(ASTRA_TOKEN)
    db = client.get_database(ASTRA_ENDPOINT)
    coll = db.get_collection("bible_ar")
    for attempt in range(2):
        try:
            # Check original case
            doc = coll.find_one({"version": v_code})
            if doc: return v_code
            # Check uppercase
            doc = coll.find_one({"version": v_code.upper()})
            if doc: return v_code.upper()
            return None
        except Exception as e:
            if attempt == 1:
                print(f"Error checking {v_code}: {e}")
            time.sleep(1)
    return None

def main():
    if not os.path.exists("refined_eligible.json"):
        print("Error: refined_eligible.json not found")
        return

    with open("refined_eligible.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        potential_versions = [item["id"] for item in data]

    print(f"Checking {len(potential_versions)} versions in Astra DB...")
    found_in_astra = []
    
    # Use thread pool to check existence in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
        results = list(executor.map(check_version, potential_versions))
        found_in_astra = [r for r in results if r]

    found_in_astra = sorted(found_in_astra)
    print(f"Total unique versions found in Astra: {len(found_in_astra)}")
    
    # Compare with export folder
    existing_files = set()
    if os.path.exists(EXPORT_DIR):
        for f in os.listdir(EXPORT_DIR):
            if f.endswith(".json") or f.endswith(".done"):
                base = f.replace(".json.done", "").replace(".json", "")
                existing_files.add(base.lower())

    missing = [v for v in found_in_astra if v.lower() not in existing_files]
    
    print(f"Versions in Astra but missing from export: {len(missing)}")
    if missing:
        print(f"Sample missing: {missing[:50]}")
    
    # Save results for puller
    with open("astra_versions_found.json", "w") as f:
        json.dump(found_in_astra, f)
    
    print("\nFull list of Astra versions saved to astra_versions_found.json")

if __name__ == "__main__":
    main()
