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

# Add eligible ones
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
new_map_str = "const hybridMap: Record<string, string> = {\n" + "\n".join(map_entries) + "\n        };"
route_content = map_pattern.sub(new_map_str, route_content)

with open(route_path, 'w', encoding='utf-8') as f:
    f.write(route_content)

# --- Update BibleExplorer.tsx ---
with open(ui_path, 'r', encoding='utf-8') as f:
    ui_content = f.read()

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
primary_options = []
for p in predefined:
    primary_options.append(f'                                        <option value="{p["id"]}">{p["name"]}</option>')
    existing_ui_ids.add(p['id'])

# Add XML ones to a separate block or similar? 
# The user wants "New Testament" block.
# Let's split eligible into "Complete" and "NT Only"
complete_bibles = []
nt_only_bibles = []

for b in eligible:
    if b['id'].lower() in existing_ui_ids: continue
    
    if b.get('ot', 0) > 0:
        complete_bibles.append(b)
    else:
        nt_only_bibles.append(b)

def build_grouped_options(bibles, already_added_ids):
    grouped = {}
    options = []
    for b in bibles:
        bid = b['id'].lower()
        if bid not in already_added_ids:
            letter = b['lang'][0].upper()
            if letter not in grouped: grouped[letter] = []
            grouped[letter].append(f'                                        <option value="{bid}">{b["lang"]} ({bid})</option>')
            already_added_ids.add(bid)
    
    for letter in sorted(grouped.keys()):
        options.append(f'                                        <option disabled>─── {letter} ───</option>')
        options.extend(grouped[letter])
    return options

# Build World Languages (Complete)
world_options = build_grouped_options(complete_bibles, existing_ui_ids)

# Build New Testament Only bibles
nt_options = build_grouped_options(nt_only_bibles, existing_ui_ids)

# Build the final strings for optgroups
new_world_optgroup = '<optgroup label="World Languages (Complete)">\n' + "\n".join(primary_options) + '\n                                        <option disabled>──────────</option>\n' + "\n".join(world_options) + '\n                                    </optgroup>'
new_nt_optgroup = '<optgroup label="New Testament Only">\n' + "\n".join(nt_options) + '\n                                    </optgroup>'

# Replace the World Languages optgroup content with BOTH groups
world_pattern = re.compile(r'<optgroup label="World Languages">[\s\S]*?</optgroup>')
# If the pattern above doesn't match (because we already renamed it in a previous run), 
# we need a more flexible pattern or handle the renamed case.
# Let's search for "World Languages" in the label.
flexible_pattern = re.compile(r'<optgroup label="World Languages.*?">[\s\S]*?</optgroup>')

# Also search for "New Testament Only" group if it exists to replace it too, 
# but usually it's easier to replace a larger block.
# Let's try to replace the block that starts with World Languages.

combined_groups = new_world_optgroup + "\n                                    " + new_nt_optgroup

if flexible_pattern.search(ui_content):
    ui_content = flexible_pattern.sub(combined_groups, ui_content)
    # If we had a previously added New Testament Only group that was NOT inside the World Languages match, 
    # we might have duplicates. So let's clean up any existing New Testament Only group.
    existing_nt_pattern = re.compile(r'<optgroup label="New Testament Only">[\s\S]*?</optgroup>')
    # If it's already there (and NOT part of what we just replaced), remove it to avoid double groups
    match_nt = existing_nt_pattern.search(ui_content)
    if match_nt:
        # Check if this match is separate from the combined_groups we just inserted
        # This is a bit tricky with simple string replace.
        # Let's just do a clean sweep: find where World Languages starts, and replace until the end of the select or specific point.
        pass

# Simplified: Use a marker-based approach or targets
# Let's find "World Languages" and replace it. 
# Then find "New Testament Only" and replace/remove it.
# Actually, sync_all_mappings is the authority.

# Let's try to find the whole group block.
ui_content = re.sub(r'<optgroup label="New Testament Only">[\s\S]*?</optgroup>', '', ui_content)
ui_content = flexible_pattern.sub(combined_groups, ui_content)

with open(ui_path, 'w', encoding='utf-8') as f:
    f.write(ui_content)

print("Synchronized Route and UI with ALL identified languages (Split Complete vs NT-Only).")
