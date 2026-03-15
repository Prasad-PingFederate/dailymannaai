import json
import io
import sys

# Ensure stdout handles unicode
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\final_import_batch.json", 'r', encoding='utf-8') as f:
    batch1 = json.load(f)
with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\second_import_batch.json", 'r', encoding='utf-8') as f:
    batch2 = json.load(f)

all_new = batch1 + batch2

print("=== MAPPINGS ===")
for item in all_new:
    print(f"            '{item['id'].lower()}': 'bible_ar',")

print("\n=== SELECT_OPTIONS ===")
for item in all_new:
    print(f"                                <option value=\"{item['id'].lower()}\">{item['lang']}</option>")

print("\n=== VAL_MAPPING ===")
for item in all_new:
    # Use lowercase name for lookup
    name_clean = item['lang'].lower().replace("'", "").replace('"', "")
    print(f"                                if (val === '{name_clean}') val = '{item['id'].lower()}';")
