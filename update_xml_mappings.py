import json
import re

# Additional XML Mappings
xml_versions = [
    {"id": "pck", "name": "Paite"},
    {"id": "arb-xml", "name": "Arabic (XML)"},
    {"id": "my-xml", "name": "Burmese (XML)"},
    {"id": "pes-xml", "name": "Farsi (XML)"},
    {"id": "tl-xml", "name": "Tagalog (XML)"},
    {"id": "tr-xml", "name": "Turkish (XML)"}
]

route_path = r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\src\app\api\bible\verses\route.ts"
with open(route_path, 'r', encoding='utf-8') as f:
    content = f.read()

mapping_str = ""
for item in xml_versions:
    mapping_str += f"            '{item['id']}': 'bible_ar',\n"

# Insert before the end of the map
# We'll find the last map entry
content = content.replace("        };", mapping_str + "        };")

with open(route_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Update UI
ui_path = r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\src\components\bible-explorer\BibleExplorer.tsx"
with open(ui_path, 'r', encoding='utf-8') as f:
    ui_content = f.read()

ui_options = "                                        // Local XML Batch\n"
for item in xml_versions:
    ui_options += f'                                        <option value="{item["id"]}">{item["name"]}</option>\n'

# Insert in optgroup
ui_content = ui_content.replace("                                    </optgroup>", ui_options + "                                    </optgroup>")

with open(ui_path, 'w', encoding='utf-8') as f:
    f.write(ui_content)

print("Updated Route and UI with Local XML bibles.")
