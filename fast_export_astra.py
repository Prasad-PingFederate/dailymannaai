import os
import json
from dotenv import load_dotenv
from astrapy import DataAPIClient

# 1. Setup
load_dotenv(".env.local")
ASTRA_TOKEN = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")

client = DataAPIClient(ASTRA_TOKEN)
db = client.get_database(ASTRA_ENDPOINT)

def export_collection(coll_name):
    print(f"🚀 Starting export of {coll_name} to JSON...")
    coll = db.get_collection(coll_name)
    
    output_file = f"{coll_name}_export.json"
    count = 0
    
    # Open file in append mode
    with open(output_file, 'w', encoding='utf-8') as f:
        # Astra Data API find() returns a cursor that handles paging automatically
        for doc in coll.find({}):
            # Remove the internal Astra ID for cleaner JSON if desired
            if "_id" in doc: del doc["_id"]
            
            # Write as a JSON line (Fastest way to handle millions of records)
            f.write(json.dumps(doc, ensure_ascii=False) + "\n")
            
            count += 1
            if count % 5000 == 0:
                print(f"  📦 Downloaded {count} verses...")
                
    print(f"✅ Export Complete! {count} verses saved to {output_file}")

if __name__ == "__main__":
    # You can change this to any collection, e.g., "bible_ar" or "bible_kjv"
    target = input("Enter collection name to export (e.g. bible_kjv): ")
    if target:
        export_collection(target)
