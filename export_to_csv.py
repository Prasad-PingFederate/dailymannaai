
import os
import csv
from dotenv import load_dotenv
from astrapy import DataAPIClient

# Load env from absolute path
ENV_PATH = r"C:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\.env.local"
load_dotenv(ENV_PATH)

token = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")

client = DataAPIClient(token)
db = client.get_database(endpoint)

colls = db.list_collection_names()
print(f"Total collections to process: {len(colls)}")

# Bible Export
bible_file = r"C:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\export_bible_verses.csv"
print(f"Exporting bibles to {bible_file}...")

with open(bible_file, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['collection', 'version', 'book', 'chapter', 'verse', 'text'])
    
    for name in sorted(colls):
        if name.startswith("bible_") and name != "bible_translations":
            print(f"  -> Exporting {name}...")
            coll = db.get_collection(name)
            cursor = coll.find({}, projection={"$vector": 0, "$vectorize": 0})
            
            count = 0
            for doc in cursor:
                # Some collections have a 'version' field, some don't (it's implicit in the name)
                version = doc.get('version', name.replace("bible_", "").upper())
                writer.writerow([
                    name,
                    version,
                    doc.get('book', ''),
                    doc.get('chapter', 0),
                    doc.get('verse', 0),
                    doc.get('text', '')
                ])
                count += 1
            print(f"     Done. {count} rows.")

# Sermons Export
sermon_file = r"C:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\export_sermons.csv"
if "sermons_archive" in colls:
    print(f"Exporting sermons to {sermon_file}...")
    with open(sermon_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        # We'll detect columns from the first doc
        coll = db.get_collection("sermons_archive")
        first = coll.find_one({})
        if first:
            keys = [k for k in first.keys() if k not in ["$vector", "$vectorize"]]
            writer.writerow(keys)
            
            cursor = coll.find({}, projection={"$vector": 0, "$vectorize": 0})
            count = 0
            for doc in cursor:
                writer.writerow([doc.get(k, '') for k in keys])
                count += 1
            print(f"     Done. {count} sermons.")

print("\nExport complete!")
