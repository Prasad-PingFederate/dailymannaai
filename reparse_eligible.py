import csv
import json

csv_path = r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\translations.csv"

eligible = []
with open(csv_path, mode='r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row.get('Redistributable') == 'True' and row.get('downloadable') == 'True':
            nt = int(row.get('NTverses', 0))
            ot = int(row.get('OTverses', 0))
            total = nt + ot
            if total > 5000:
                eligible.append({
                    'id': row['translationId'],
                    'lang': row['languageNameInEnglish'],
                    'title': row['title'],
                    'code': row['languageCode'],
                    'nt': nt,
                    'ot': ot,
                    'total': total
                })

# Sort by total verses descending
eligible.sort(key=lambda x: x['total'], reverse=True)

with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\refined_eligible.json", 'w') as f:
    json.dump(eligible, f, indent=2)

print(f"Refined {len(eligible)} bibles.")
for item in eligible[:10]:
    print(f"  {item['id']} ({item['lang']}): {item['total']} verses")
