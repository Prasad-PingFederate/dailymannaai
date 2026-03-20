import os
import glob
import json

def count_local():
    total = 0
    # Add all folders that contain JSON files
    folders = ["export", "processed_backup", "."]
    
    for folder in folders:
        if not os.path.isdir(folder):
            continue
        files = glob.glob(os.path.join(folder, "*.json"))
        for f in files:
            # We skip system files or logs
            if "refined_eligible" in f or "migration_progress" in f:
                continue
            with open(f, 'r', encoding='utf-8') as file:
                for line in file:
                    if line.strip():
                        total += 1
                        
    print(f"Total local verses found on disk: {total}")
    return total

if __name__ == "__main__":
    count_local()
