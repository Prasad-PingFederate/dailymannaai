import json
import re

with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\final_import_batch.json", 'r', encoding='utf-8') as f:
    batch1 = json.load(f)
with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\second_import_batch.json", 'r', encoding='utf-8') as f:
    batch2 = json.load(f)

all_new = batch1 + batch2

# --- 1. Generation of the val mapping logic in the header select ---
# Found inside: {['NIV', 'KJV', ...].map(v => { ... })}
val_mappings = "                                // Deep Search Combined Batch (Automated)\n"
for item in all_new:
    name_clean = item['lang'].lower().replace("'", "").replace('"', "")
    val_mappings += f"                                if (val === '{name_clean}') val = '{item['id'].lower()}';\n"

# --- 2. Generation of the UI Option tags ---
# For the sidebar optgroup
ui_options = "                                        // Deep Search Combined Batch (Automated)\n"
for item in all_new:
    ui_options += f'                                        <option value="{item["id"].lower()}">{item["lang"]}</option>\n'

# --- 3. Generation of initial array in the header select ---
# {['NIV', 'KJV', ...].map(v => ...)}
# This part is harder to replace via regex reliably if the list grows too large.
# I will just replace the val mapping block and the optgroup.

path = r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\src\components\bible-explorer\BibleExplorer.tsx"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update val mapping logic in the header select
# It was between 'ancient hebrew' and 'return <option'
pattern_val = r'(if \(val === \'ancient hebrew\'\) val = \'hbo\';).*?(return <option)'
replacement_val = r'\1\n' + val_mappings + r'                                \2'
content = re.sub(pattern_val, replacement_val, content, flags=re.DOTALL)

# Update the optgroup in the footer of the sidebar select
# It was between 'Zulu' and '</optgroup>'
pattern_opt = r'(<option value="zulu">Zulu</option>).*?(</optgroup>)'
replacement_opt = r'\1\n' + ui_options + r'                                    \2'
content = re.sub(pattern_opt, replacement_opt, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated BibleExplorer.tsx with all 70 bibles.")
