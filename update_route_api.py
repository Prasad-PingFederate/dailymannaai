import json

with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\final_import_batch.json", 'r', encoding='utf-8') as f:
    batch1 = json.load(f)
with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\second_import_batch.json", 'r', encoding='utf-8') as f:
    batch2 = json.load(f)

all_new = batch1 + batch2

mapping_str = ""
for item in all_new:
    mapping_str += f"            '{item['id'].lower()}': 'bible_ar',\n"

# Replace the block in route.ts
with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\src\app\api\bible\verses\route.ts", 'r', encoding='utf-8') as f:
    content = f.read()

# Define the start and end of the block to replace
start_marker = "// New imports (also in bible_ar collection)"
end_marker = "        };"

# Find original static mappings to preserve (everything before "New imports")
# Actually, I'll just rebuild the whole hybridMap from line 21 to 105.

new_map = """        const hybridMap: Record<string, string> = {
            'ru': 'bible_de',
            'ko': 'bible_fr',
            'te': 'bible_es',
            'ta': 'bible_pt',
            // godlytalias/Bible-Database imports (bible_ar collection)
            'afrikaans': 'bible_ar',
            'bengali': 'bible_ar',
            'english': 'bible_ar',
            'gujarati': 'bible_ar',
            'hindi': 'bible_ar',
            'hungarian': 'bible_ar',
            'indonesian': 'bible_ar',
            'kannada': 'bible_ar',
            'malayalam': 'bible_ar',
            'marathi': 'bible_ar',
            'nepali': 'bible_ar',
            'oriya': 'bible_ar',
            'punjabi': 'bible_ar',
            'sepedi': 'bible_ar',
            'xhosa': 'bible_ar',
            'zulu': 'bible_ar',
            // Deep Search Combined Batch (Automated)
""" + mapping_str + "        };"

import re
# Match everything between const hybridMap and };
content = re.sub(r'const hybridMap: Record<string, string> = \{.*?        \};', new_map, content, flags=re.DOTALL)

with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\src\app\api\bible\verses\route.ts", 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated route.ts with all 70 bibles.")
