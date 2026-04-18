import os
import asyncio
import hmac
import hashlib
import base64
import urllib.parse
from datetime import datetime, timezone
import aiohttp
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

async def fetch_ids():
    resource_link = f"dbs/{DB_NAME}/colls/{CONTAINER_NAME}"
    url = f"{ENDPOINT}{resource_link}/docs"
    
    headers = {
        "x-ms-version": "2018-12-31",
        "Content-Type": "application/query+json",
        "x-ms-documentdb-isquery": "True",
        "x-ms-documentdb-query-enablecrosspartition": "True",
        "x-ms-max-item-count": "1000"
    }
    
    # Selecting JUST the id is cheap and fast
    query = {"query": "SELECT c.id FROM c"}
    
    print(f"🚀 [FETCH IDs] Starting pull from Cosmos...")
    
    count = 0
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        async with aiohttp.ClientSession() as session:
            token = None
            finished = False
            while not finished:
                date = datetime.now(timezone.utc).strftime('%a, %d %b %Y %H:%M:%S GMT')
                auth = get_auth_header("POST", "docs", resource_link, date)
                
                headers["Authorization"] = auth
                headers["x-ms-date"] = date
                if token:
                    headers["x-ms-continuation"] = token
                else:
                    headers.pop("x-ms-continuation", None)
                
                try:
                    async with session.post(url, json=query, headers=headers, timeout=60) as resp:
                        if resp.status == 429:
                            retry_after = float(resp.headers.get("x-ms-retry-after-ms", 2000)) / 1000.0
                            print(f"⚠️  Rate Limited. Waiting {retry_after}s...")
                            await asyncio.sleep(retry_after)
                            continue
                        
                        if resp.status != 200:
                            print(f"❌ HTTP {resp.status}: {await resp.text()}")
                            # Try again? e.g. for transient failures
                            await asyncio.sleep(2)
                            continue
                            
                        data = await resp.json()
                        token = resp.headers.get("x-ms-continuation")
                        
                        for doc in data.get("Documents", []):
                            f.write(doc["id"] + "\n")
                            count += 1
                        
                        if count % 100000 == 0:
                            print(f"  📥 Fetched {count:,} IDs total...")
                            
                        if not token:
                            finished = True
                except Exception as e:
                    print(f"⚠️  Network error: {e}. Retrying...")
                    await asyncio.sleep(5)
                    continue
                    
    print(f"✨ SUCCESS: Fetched {count:,} total IDs into {OUTPUT_FILE}")

if __name__ == "__main__":
    try:
        asyncio.run(fetch_ids())
    except KeyboardInterrupt:
        print("Interrupted by user.")
