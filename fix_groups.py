import json
import re

ui_path = r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\src\components\bible-explorer\BibleExplorer.tsx"
eligible_path = r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\refined_eligible.json"

with open(eligible_path, 'r', encoding='utf-8') as f:
    eligible = json.load(f)

eligible.sort(key=lambda x: x['lang'])

# Pre-defined ones (to be excluded from general world grouping if they are already there)
predefined_ids = {'es', 'zh', 'ja', 'ko', 'vi', 'tl', 'th', 'my', 'id'}

has_ot = [l for l in eligible if l.get('ot', 0) > 0 and l['id'].lower() not in predefined_ids]
nt_only = [l for l in eligible if l.get('ot', 0) == 0 and l['id'].lower() not in predefined_ids]

def build_opts(bibles):
    grouped = {}
    for b in bibles:
        letter = b['lang'][0].upper()
        if letter not in grouped: grouped[letter] = []
        grouped[letter].append(f'                                        <option value="{b["id"].lower()}">{b["lang"]} ({b["id"]})</option>')
    
    output = []
    for letter in sorted(grouped.keys()):
        output.append(f'                                        <option disabled>─── {letter} ───</option>')
        output.extend(grouped[letter])
    return "\n".join(output)

world_complete_html = build_opts(has_ot)
nt_only_html = build_opts(nt_only)

with open(ui_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the full block of groups to replace everything between Primary and Global
# or just target World Languages and New Testament Only.

# Let's find everything from <optgroup label="World Languages (Complete)"> to the end of <optgroup label="New Testament Only">
combined_html = f"""<optgroup label="World Languages (Complete)">
                                        <option value="es">Español (RVR)</option>
                                        <option value="zh">中文 (Union)</option>
                                        <option value="ja">日本語 (Japanese)</option>
                                        <option value="ko">한국어 (Korean)</option>
                                        <option value="vi">Tiếng Việt (Vietnamese)</option>
                                        <option value="tl">Tagalog (Ang Biblia)</option>
                                        <option value="th">ไทย (Thai)</option>
                                        <option value="my">မြန်မာစာ (Burmese)</option>
                                        <option value="id">Indonesia (TB)</option>
                                        <option disabled>──────────</option>
{world_complete_html}
                                    </optgroup>
                                    <optgroup label="New Testament Only">
{nt_only_html}
                                    </optgroup>"""

# Regex to find the existing World Languages (Complete) and New Testament Only groups
pattern = re.compile(r'<optgroup label="World Languages \(Complete\)">[\s\S]*?</optgroup>\s*<optgroup label="New Testament Only">[\s\S]*?</optgroup>')

if pattern.search(content):
    content = pattern.sub(combined_html, content)
else:
    # Fallback if the labels were different
    pattern2 = re.compile(r'<optgroup label="World Languages">[\s\S]*?</optgroup>')
    content = pattern2.sub(combined_html, content)

with open(ui_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated BibleExplorer.tsx with separate Complete and NT-Only groups.")
