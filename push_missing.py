import os
import asyncio
import json
from azure.cosmos.aio import CosmosClient
from azure.cosmos import PartitionKey
import time
from dotenv import load_dotenv

DATABASE_NAME = "BibleDatabase"
CONTAINER_NAME = "verses"

FILES_TO_UPLOAD = [
    "CES1613.json",
    "CESLB.json",
    "CESNKB.json",
    "CTUBL.json",
    "DWW.json",
    "ISL.json",
    "KGF.json",
    "KYG.json",
    "SSD.json"
]

async def upload_file(container, file_path):
    version_id = os.path.basename(file_path).split('.')[0].upper()
    print(f"--- Uploading {version_id} ---")
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            data = [json.loads(l) for l in lines if l.strip()]
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return
        
    count = 0
    total = len(data)
    start_time = time.time()
    
    for item in data:
        if 'id' not in item:
            item['id'] = f"{item['version']}_{item['book']}_{item['chapter']}_{item['verse']}"
        
        try:
            await container.upsert_item(item)
            count += 1
            if count % 200 == 0:
                print(f"[{version_id}] Progress: {count}/{total} ({(count/total)*100:.1f}%)")
        except Exception as e:
            pass

    duration = time.time() - start_time
    print(f"Completed {version_id}: {count} items in {duration:.1f}s")
    
    try:
        os.rename(file_path, file_path + ".done")
    except:
        pass

async def main():
    load_dotenv(".env.local")
    conn_str = os.getenv("COSMOS_CONNECTION_STRING")
    if not conn_str:
        print("No connection string found!")
        return

    def parse_conn_str(c):
        p = {}
        for pair in c.split(';'):
            if '=' in pair:
                k, v = pair.split('=', 1)
                p[k] = v
        return p['AccountEndpoint'], p['AccountKey']

    endpoint, key = parse_conn_str(conn_str)
    client = CosmosClient(endpoint, key)
    database = client.get_database_client(DATABASE_NAME)
    container = database.get_container_client(CONTAINER_NAME)
    
    tasks = []
    for f in FILES_TO_UPLOAD:
        path = os.path.join("export", f)
        tasks.append(upload_file(container, path))
    
    await asyncio.gather(*tasks)
    await client.close()

if __name__ == "__main__":
    asyncio.run(main())
