"""Quick script to finish uploading CES1613 only"""
import os, json, time, asyncio, hmac, hashlib, base64, urllib.parse
from datetime import datetime, timezone
import aiohttp, aiofiles
from dotenv import load_dotenv

load_dotenv('.env.local')
CONN_STR = os.getenv('COSMOS_CONNECTION_STRING')
parts = {}
for pair in CONN_STR.split(';'):
    if '=' in pair:
        key, val = pair.split('=', 1)
        parts[key] = val
ENDPOINT, MASTER_KEY = parts['AccountEndpoint'], parts['AccountKey']

pushed = 0
failed = 0

def get_auth(verb, rtype, rid, date):
    key = base64.b64decode(MASTER_KEY)
    text = f"{verb.lower()}\n{rtype.lower()}\n{rid}\n{date.lower()}\n\n"
    sig = base64.b64encode(hmac.new(key, text.encode(), hashlib.sha256).digest()).decode()
    return urllib.parse.quote(f"type=master&ver=1.0&sig={sig}")

async def upsert(session, doc, sem):
    global pushed, failed
    rl = "dbs/BibleDatabase/colls/verses"
    url = f"{ENDPOINT}dbs/BibleDatabase/colls/verses/docs"
    async with sem:
        for a in range(8):
            d = datetime.now(timezone.utc).strftime('%a, %d %b %Y %H:%M:%S GMT')
            h = {
                "Authorization": get_auth("POST","docs",rl,d),
                "x-ms-date": d,
                "x-ms-version": "2018-12-31",
                "x-ms-documentdb-is-upsert": "True",
                "Content-Type": "application/json",
                "x-ms-documentdb-partitionkey": json.dumps([doc["version"]])
            }
            try:
                async with session.post(url, json=doc, headers=h, timeout=aiohttp.ClientTimeout(total=20)) as r:
                    if r.status in [200,201]:
                        pushed += 1
                        return
                    elif r.status == 429:
                        await asyncio.sleep(float(r.headers.get("x-ms-retry-after-ms", 200))/1000)
                    else:
                        await asyncio.sleep(0.2)
            except:
                await asyncio.sleep(0.5*(a+1))
        failed += 1

async def main():
    global pushed
    docs = []
    with open("export/CES1613.json", "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                raw = json.loads(line)
                vid = f"{raw.get('book')}_{raw.get('chapter')}_{raw.get('verse')}_CES1613"
                docs.append({
                    "id": vid, "version": "CES1613",
                    "book": raw.get("book"),
                    "chapter": int(raw.get("chapter", 0)),
                    "verse": int(raw.get("verse", 0)),
                    "text": raw.get("text", "")
                })
            except:
                pass
    print(f"CES1613: {len(docs)} verses to upload")
    t0 = time.time()
    sem = asyncio.Semaphore(1500)
    conn = aiohttp.TCPConnector(limit=1500, ttl_dns_cache=300)
    async with aiohttp.ClientSession(connector=conn) as session:
        for i in range(0, len(docs), 500):
            chunk = docs[i:i+500]
            await asyncio.gather(*[upsert(session, d, sem) for d in chunk])
            pct = min(i+500, len(docs)) / len(docs) * 100
            vps = min(i+500, len(docs)) / (time.time()-t0) if (time.time()-t0) > 0 else 0
            print(f"CES1613: {min(i+500,len(docs))}/{len(docs)} ({pct:.0f}%) {vps:.0f} v/s")
    print(f"Done: {pushed} pushed, {failed} failed in {time.time()-t0:.0f}s")

asyncio.run(main())
