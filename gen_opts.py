import json

with open('refined_eligible.json', 'r') as f:
    el = json.load(f)

# Sort by language name
el.sort(key=lambda x: x['lang'])

has_ot = [l for l in el if l.get('ot', 0) > 0]
nt_only = [l for l in el if l.get('ot', 0) == 0]

def get_grouped_opts(bibles):
    grouped = {}
    for b in bibles:
        letter = b['lang'][0].upper()
        if letter not in grouped: grouped[letter] = []
        grouped[letter].append(f'<option value="{b["id"].lower()}">{b["lang"]} ({b["id"]})</option>')
    
    lines = []
    for letter in sorted(grouped.keys()):
        lines.append(f'<option disabled>─── {letter} ───</option>')
        lines.extend(grouped[letter])
    return "\n".join(lines)

print("---WORLD_COMPLETE---")
print(get_grouped_opts(has_ot))
print("---NT_ONLY---")
print(get_grouped_opts(nt_only))
