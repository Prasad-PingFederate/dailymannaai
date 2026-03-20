import os
import json
import concurrent.futures
from dotenv import load_dotenv
from astrapy import DataAPIClient

# 1. Setup
load_dotenv(".env.local")
ASTRA_TOKEN = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")

client = DataAPIClient(ASTRA_TOKEN)
db = client.get_database(ASTRA_ENDPOINT)
coll = db.get_collection("bible_ar")

missing_versions = ['tzoznt', 'ubu-andelale', 'ubu-kala', 'ubu-nopenge', 'uli', 'urant', 'urbnt', 'urt', 'uvh', 'waj', 'wapnt', 'wer', 'wim', 'wiu', 'wnu', 'wos', 'xnn', 'xon', 'xtdnt', 'yaant', 'yby', 'ycn', 'yle', 'yss-yawu', 'yuj', 'zaant', 'zavnt', 'zia', 'zpmnt', 'zpqnt']

def download_version(v_code):
    try:
        filename = f"export/{v_code}.json"
        if os.path.exists(filename):
            print(f"⚠️  {filename} already exists. Skipping.")
            return True
            
        count = 0
        with open(filename, 'w', encoding='utf-8') as f:
            for doc in coll.find({"version": v_code}):
                if "_id" in doc: del doc["_id"]
                f.write(json.dumps(doc, ensure_ascii=False) + "\n")
                count += 1
        
        if count > 0:
            print(f"✅ Downloaded {v_code}: {count} verses.")
        else:
            print(f"⚠️  No records for {v_code}.")
            os.remove(filename) 
        return True
    except Exception as e:
        print(f"❌ Error downloading {v_code}: {e}")
        return False

def main():
    if not os.path.exists("export"):
        os.makedirs("export")

    print(f"🚀 Exporting {len(missing_versions)} missing versions...")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        executor.map(download_version, missing_versions)

    print("\n🏁 Missing Versions Export Finished!")

if __name__ == "__main__":
    main()
