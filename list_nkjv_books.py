import json
with open(r"C:\Users\Infobell\.gemini\antigravity\scratch\kjv-nkjv-comparison\nkjv.json", 'r', encoding='utf-8') as f:
    data = json.load(f)
for book in data.get("books", []):
    print(book.get("name"))
