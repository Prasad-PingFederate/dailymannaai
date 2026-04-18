import json
import os

# Files
refined_file = r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\refined_eligible.json"
batch2_file = r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\second_import_batch.json"
output_file = r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\third_import_batch.json"

with open(refined_file, 'r') as f:
    eligible = json.load(f)

with open(batch2_file, 'r') as f:
    batch2 = json.load(f)

batch2_ids = {item['id'] for item in batch2}

# We already had some in Batch 1 (not tracked in a separate JSON yet, but they are in the DB)
# However, Batch 1 was processed before I systematized this.
# Let's just filter out Batch 2 for now, and rely on the importer's "if exists" check.

third_batch = []
count = 0
for item in eligible:
    if item['id'] not in batch2_ids:
        third_batch.append(item)
        count += 1
        if count >= 100: # Let's get 100 this time
            break

with open(output_file, 'w') as f:
    json.dump(third_batch, f, indent=2)

print(f"Generated third batch with {len(third_batch)} languages.")
