import csv
import os

csv_path = r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\translations.csv"

# Potential versions already in DB based on previous checks
# Specific collections: afrikaans, ar, de, es, final_ru, fr, id, kjv, niv, nkjv, pt, zh
# Inside bible_ar: DA, HY, LT, MANIPURI, RO, SANSKRIT, TH, etc.
# Note: bible_ar might actually just be the Arabic collection, but it seems mixed?
# Let's assume versions in bible_ar are just codes.

eligible = []

with open(csv_path, mode='r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Check if redistributable and downloadable
        if row.get('Redistributable') == 'True' and row.get('downloadable') == 'True':
            # Check if it has a decent amount of content (NT or OT)
            nt_verses = int(row.get('NTverses', 0))
            ot_verses = int(row.get('OTverses', 0))
            if nt_verses > 5000 or ot_verses > 20000:
                eligible.append({
                    'id': row['translationId'],
                    'lang': row['languageNameInEnglish'],
                    'title': row['title'],
                    'code': row['languageCode']
                })

print(f"Found {len(eligible)} eligible bibles.")
# Print first 20 for inspection
for item in eligible[:20]:
    print(f"  {item['id']} ({item['lang']}): {item['title']}")

# Save to a file for the next step
import json
with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\eligible_bibles.json", 'w') as f:
    json.dump(eligible, f, indent=2)
