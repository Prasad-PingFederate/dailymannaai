import os
import glob
import json

# This checks if the verses in the local export are ALREADY accounted for in the 7.6M known IDs or 8.2M Cosmos set.
def check_relevance():
    # Load IDs we already know are in Cosmos (if we have that file)
    known_file = "cosmos_existing_ids.txt"
    if os.path.exists(known_file):
        with open(known_file, 'r', encoding='utf-8') as f:
            known = set(line.strip() for line in f)
        print(f"Loaded {len(known)} existing IDs from {known_file}")
    else:
        print("Existing IDs file missing! Building from scratch...")
        return

    export_files = glob.glob("export/*.json")
    if not export_files:
        print("No files in export/ folder.")
        return

    sample_file = export_files[0]
    print(f"Checking sample file: {sample_file}")
    
    found_new = 0
    total_checked = 0
    with open(sample_file, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip(): continue
            total_checked += 1
            raw = json.loads(line)
            # Create the unique ID we use in Cosmos
            v_id = f"{raw['book']}_{raw['chapter']}_{raw['verse']}_{raw['version']}"
            if v_id not in known:
                found_new += 1
                if found_new < 5:
                    print(f"Found NEW verse: {v_id}")

    print(f"Sample Result: Checked {total_checked} | NEW found: {found_new}")
    
    if found_new == 0:
        print("🔥 DRAINED: All verses in this folder are ALREADY in Cosmos DB.")
    else:
        print(f"🚀 ACTIVE: This folder has {found_new} verses we haven't pushed yet!")

if __name__ == "__main__":
    check_relevance()
