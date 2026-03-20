import os
import asyncio
import hmac
import hashlib
import base64
import urllib.parse
from datetime import datetime, timezone
import aiohttp
import json
from dotenv import load_dotenv

load_dotenv(".env.local")
CONN_STR = os.getenv("COSMOS_CONNECTION_STRING")

def parse_conn_str(conn_str):
    parts = {}
    for pair in conn_str.split(';'):
        if '=' in pair:
            key, val = pair.split('=', 1)
            parts[key] = val
    return parts['AccountEndpoint'], parts['AccountKey']

ENDPOINT, MASTER_KEY = parse_conn_str(CONN_STR)
DB_NAME = "BibleDatabase"
CONTAINER_NAME = "verses"
OUTPUT_FILE = "cosmos_existing_ids.txt"

def get_auth_header(verb, resource_type, resource_id, date):
    key = base64.b64decode(MASTER_KEY)
    text = f"{verb.lower()}\n{resource_type.lower()}\n{resource_id}\n{date.lower()}\n\n"
    hmac_obj = hmac.new(key, text.encode('utf-8'), hashlib.sha256)
    signature = base64.b64encode(hmac_obj.digest()).decode('utf-8')
    auth_str = urllib.parse.quote(f"type=master&ver=1.0&sig={signature}")
    return auth_str

async def fetch_version_ids(session, v_code, sem, output_list):
    resource_link = f"dbs/{DB_NAME}/colls/{CONTAINER_NAME}"
    url = f"{ENDPOINT}{resource_link}/docs"
    query = {"query": "SELECT c.id FROM c"}
    
    async with sem:
        token = None
        while True:
            date = datetime.now(timezone.utc).strftime('%a, %d %b %Y %H:%M:%S GMT')
            auth = get_auth_header("POST", "docs", resource_link, date)
            
            headers = {
                "Authorization": auth,
                "x-ms-date": date,
                "x-ms-version": "2018-12-31",
                "Content-Type": "application/query+json",
                "x-ms-documentdb-isquery": "True",
                "x-ms-documentdb-partitionkey": json.dumps([v_code]),
                "x-ms-max-item-count": "1000"
            }
            if token: headers["x-ms-continuation"] = token
            
            try:
                async with session.post(url, json=query, headers=headers, timeout=30) as resp:
                    if resp.status == 429:
                        await asyncio.sleep(1)
                        continue
                    if resp.status != 200: break
                    data = await resp.json()
                    ids = [d["id"] for d in data.get("Documents", [])]
                    output_list.extend(ids)
                    token = resp.headers.get("x-ms-continuation")
                    if not token: break
            except:
                break

async def main():
    with open("astra_versions_found.json", "r") as f:
        versions = json.load(f)
    
    import random
    random.shuffle(versions)
    
    print(f"🚀 [FIXED V3] Fetching IDs for {len(versions)} versions...")
    all_ids = []
    sem = asyncio.Semaphore(50) 
    
    connector = aiohttp.TCPConnector(limit=200)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [asyncio.create_task(fetch_version_ids(session, v, sem, all_ids)) for v in versions]
        
        while any(not t.done() for t in tasks):
            await asyncio.sleep(10)
            print(f"  📥 Currently have {len(all_ids):,} IDs fetched...")
                
    print(f"✨ Total IDs found: {len(all_ids):,}")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for vid in all_ids:
            f.write(vid + "\n")
    print(f"Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    asyncio.run(main())
