import json
import os
import glob

def find_missing():
    # 1. Load the Master List from JSON
    with open("refined_eligible.json", "r", encoding="utf-8") as f:
        master_list = json.load(f)
    master_ids = set(item['id'].lower() for item in master_list)
    print(f"Total versions in master list: {len(master_ids)}")

    # 2. Get the already finished versions from disk
    done_files = glob.glob("export/*.json.done") + glob.glob("processed_backup/*.json.done")
    # File names are like 'francl.json.done' -> ID is 'francl'
    done_ids = set()
    for f in done_files:
        name = os.path.basename(f).replace(".json.done", "").replace(".json", "").lower()
        done_ids.add(name)
        
    print(f"Total versions already 'Done' on disk: {len(done_ids)}")

    # 3. Calculate missing
    missing_ids = master_ids - done_ids
    print(f"\n--- MISSING VERSIONS ({len(missing_ids)}) ---")
    
    # Sort and save them for the exporter
    missing_list = sorted(list(missing_ids))
    for mid in missing_list[:10]:
        print(f"👉 {mid}")

    with open("versions_to_export.txt", "w", encoding="utf-8") as f:
        for mid in missing_list:
            f.write(mid + "\n")
            
    print(f"✅ Saved {len(missing_list)} IDs to 'versions_to_export.txt'")

if __name__ == "__main__":
    find_missing()
