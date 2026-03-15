import json
import os
import re

# Paths
route_path = r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\src\app\api\bible\verses\route.ts"
ui_path = r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\src\components\bible-explorer\BibleExplorer.tsx"
eligible_path = r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\refined_eligible.json"

# Load identified bibles
with open(eligible_path, 'r') as f:
    eligible = json.load(f)

# Local XML Bibles
xml_bibles = [
    {"id": "pck", "name": "Paite"},
    {"id": "arb-xml", "name": "Arabic (XML)"},
    {"id": "my-xml", "name": "Burmese (XML)"},
    {"id": "pes-xml", "name": "Farsi (XML)"},
    {"id": "tl-xml", "name": "Tagalog (XML)"},
    {"id": "tr-xml", "name": "Turkish (XML)"},
    {"id": "tam-repo", "name": "Tamil (Special)"},
    {"id": "tel-repo", "name": "Telugu (Special)"}
]

# Database Database imports (hardcoded in initial app)
initial_db_bibles = [
    "afrikaans", "bengali", "english", "gujarati", "hindi", "hungarian",
    "indonesian", "kannada", "malayalam", "marathi", "nepali", "oriya",
    "punjabi", "sepedi", "xhosa", "zulu"
]

all_ids = set()
map_entries = []

# Add initial ones
for bid in initial_db_bibles:
    all_ids.add(bid.lower())
    map_entries.append(f"            '{bid.lower()}': 'bible_ar',")

# Add XML ones
for b in xml_bibles:
    all_ids.add(b['id'].lower())
    map_entries.append(f"            '{b['id'].lower()}': 'bible_ar',")

# Add eligible ones (Batch 1, 2, 3...)
# We'll include EVERYTHING in the eligible list because the API should be ready for them
for b in eligible:
    bid = b['id'].lower()
    if bid not in all_ids:
        all_ids.add(bid)
        map_entries.append(f"            '{bid}': 'bible_ar',")

# --- Update route.ts ---
with open(route_path, 'r', encoding='utf-8') as f:
    route_content = f.read()

# Replace the entire hybridMap content
map_pattern = re.compile(r'const hybridMap: Record<string, string> = \{([\s\S]*?)\};')
new_map_str = "const hybridMap: Record<string, string> = {\n            'ru': 'bible_de',\n            'ko': 'bible_fr',\n            'te': 'bible_es',\n            'ta': 'bible_pt',\n" + "\n".join(map_entries) + "\n        };"
route_content = map_pattern.sub(new_map_str, route_content)

with open(route_path, 'w', encoding='utf-8') as f:
    f.write(route_content)

# --- Update BibleExplorer.tsx ---
with open(ui_path, 'r', encoding='utf-8') as f:
    ui_content = f.read()

# Build UI options for World Languages
ui_options = []
# Pre-defined world languages (keep them at top)
predefined = [
    {"id": "es", "name": "Español (RVR)"},
    {"id": "zh", "name": "中文 (Union)"},
    {"id": "ja", "name": "日本語 (Japanese)"},
    {"id": "ko", "name": "한국어 (Korean)"},
    {"id": "vi", "name": "Tiếng Việt (Vietnamese)"},
    {"id": "tl", "name": "Tagalog (Ang Biblia)"},
    {"id": "th", "name": "ไทย (Thai)"},
    {"id": "my", "name": "မြန်မာစာ (Burmese)"},
    {"id": "id", "name": "Indonesia (TB)"}
]
existing_ui_ids = set()
for p in predefined:
    ui_options.append(f'                                        <option value="{p["id"]}">{p["name"]}</option>')
    existing_ui_ids.add(p['id'])

# Add XML ones
ui_options.append('                                        <option disabled>──────────</option>')
ui_options.append('                                        <option disabled>LOCAL XML</option>')
for b in xml_bibles:
    if b['id'] not in existing_ui_ids:
        ui_options.append(f'                                        <option value="{b["id"]}">{b["name"]}</option>')
        existing_ui_ids.add(b['id'])

# Add the rest (Batch 1, 2, 3...)
ui_options.append('                                        <option disabled>──────────</option>')
ui_options.append('                                        <option disabled>EBIBLE.ORG COLLECTIONS</option>')

# Group by first letter
grouped = {}
for b in eligible:
    bid = b['id'].lower()
    if bid not in existing_ui_ids:
        letter = b['lang'][0].upper()
        if letter not in grouped: grouped[letter] = []
        grouped[letter].append(f'                                        <option value="{bid}">{b["lang"]} ({bid})</option>')
        existing_ui_ids.add(bid)

for letter in sorted(grouped.keys()):
    ui_options.append(f'                                        <option disabled>─── {letter} ───</option>')
    ui_options.extend(grouped[letter])

# Replace the World Languages optgroup content
# Find <optgroup label="World Languages"> ... </optgroup>
world_pattern = re.compile(r'<optgroup label="World Languages">[\s\S]*?</optgroup>')
new_world_str = '<optgroup label="World Languages">\n' + "\n".join(ui_options) + '\n                                    </optgroup>'
ui_content = world_pattern.sub(new_world_str, ui_content)

# Also clean up the double XML in Biblical Languages if it's there
biblical_pattern = re.compile(r'<optgroup label="Biblical Languages">([\s\S]*?)</optgroup>')
match = biblical_pattern.search(ui_content)
if match:
    biblical_inner = match.group(1)
    # Remove any lines containing "// Local XML Batch" or the specific XML options if they were mistakenly added
    clean_biblical = []
    for line in biblical_inner.splitlines():
        if "Local XML Batch" in line or any(xb['id'] in line for xb in xml_bibles):
            continue
        clean_biblical.append(line)
    new_biblical_str = '<optgroup label="Biblical Languages">\n' + "\n".join(clean_biblical) + '\n                                    </optgroup>'
    ui_content = biblical_pattern.sub(new_biblical_str, ui_content)

with open(ui_path, 'w', encoding='utf-8') as f:
    f.write(ui_content)

print("Synchronized Route and UI with ALL identified languages.")
