import os, sys, json, time, asyncio, hmac, hashlib, base64, urllib.parse
import aiohttp, requests, zipfile, re
from io import BytesIO
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv(".env.local")
CONN_STR = os.getenv("COSMOS_CONNECTION_STRING")
parts = {}
for pair in CONN_STR.split(';'):
    if '=' in pair:
        key, val = pair.split('=', 1)
        parts[key] = val
ENDPOINT, MASTER_KEY = parts['AccountEndpoint'], parts['AccountKey']

pushed = 0
failed = 0

USFM_BOOKS = {
    "GEN": "Genesis", "EXO": "Exodus", "LEV": "Leviticus", "NUM": "Numbers", "DEU": "Deuteronomy",
    "JOS": "Joshua", "JDG": "Judges", "RUT": "Ruth", "1SA": "1 Samuel", "2SA": "2 Samuel",
    "1KI": "1 Kings", "2KI": "2 Kings", "1CH": "1 Chronicles", "2CH": "2 Chronicles",
    "EZR": "Ezra", "NEH": "Nehemiah", "EST": "Esther", "JOB": "Job", "PSA": "Psalms",
    "PRO": "Proverbs", "ECC": "Ecclesiastes", "SNG": "Song of Solomon", "ISA": "Isaiah",
    "JER": "Jeremiah", "LAM": "Lamentations", "EZK": "Ezekiel", "DAN": "Daniel",
    "HOS": "Hosea", "JOL": "Joel", "AMO": "Amos", "OBA": "Obadiah", "JON": "Jonah",
    "MIC": "Micah", "NAM": "Nahum", "HAB": "Habakkuk", "ZEP": "Zephaniah", "HAG": "Haggai",
    "ZEC": "Zechariah", "MAL": "Malachi",
    "MAT": "Matthew", "MAR": "Mark", "LUK": "Luke", "JHN": "John", "ACT": "Acts",
    "ROM": "Romans", "1CO": "1 Corinthians", "2CO": "2 Corinthians", "GAL": "Galatians",
    "EPH": "Ephesians", "PHP": "Philippians", "COL": "Colossians", "1TH": "1 Thessalonians",
    "2TH": "2 Thessalonians", "1TI": "1 Timothy", "2TI": "2 Timothy", "TIT": "Titus",
    "PHM": "Philemon", "HEB": "Hebrews", "JAS": "James", "1PE": "1 Peter", "2PE": "2 Peter",
    "1JN": "1 John", "2JN": "2 John", "3JN": "3 John", "JUD": "Jude", "REV": "Revelation"
}

def parse_usfm_content(content, version_code):
    verses = []
    current_book = None
    current_chapter = 0
    lines = content.splitlines()
    for line in lines:
        line = line.strip()
        if not line: continue
        if line.startswith("\\id "):
            book_id = line.split()[1].upper()
            current_book = USFM_BOOKS.get(book_id)
        elif line.startswith("\\c "):
            try: current_chapter = int(line.split()[1])
            except: pass
        elif line.startswith("\\v "):
            if not current_book or current_chapter == 0: continue
            match = re.match(r"\\v\s+(\d+(?:-\d+)?)\s+(.*)", line)
            if match:
                v_num_str, v_text = match.group(1), match.group(2)
                v_num = int(v_num_str.split('-')[0])
                v_text = re.sub(r'\\(\w+)\s*.*?\s*\\\1\*', '', v_text)
                v_text = re.sub(r'\\\w+\*?', '', v_text).strip()
                if v_text:
                    verses.append({
                        "id": f"{current_book}_{current_chapter}_{v_num}_{version_code}",
                        "version": version_code, "book": current_book,
                        "chapter": current_chapter, "verse": v_num, "text": v_text
                    })
    return verses

def get_auth(verb, rtype, rid, date):
    key = base64.b64decode(MASTER_KEY)
    text = f"{verb.lower()}\n{rtype.lower()}\n{rid}\n{date.lower()}\n\n"
    sig = base64.b64encode(hmac.new(key, text.encode(), hashlib.sha256).digest()).decode()
    return urllib.parse.quote(f"type=master&ver=1.0&sig={sig}")

async def upsert(session, doc, sem):
    global pushed, failed
    rl, url = "dbs/BibleDatabase/colls/verses", f"{ENDPOINT}dbs/BibleDatabase/colls/verses/docs"
    async with sem:
        for a in range(8):
            d = datetime.now(timezone.utc).strftime('%a, %d %b %Y %H:%M:%S GMT')
            h = {"Authorization": get_auth("POST","docs",rl,d), "x-ms-date":d, "x-ms-version":"2018-12-31", "x-ms-documentdb-is-upsert":"True", "Content-Type":"application/json", "x-ms-documentdb-partitionkey": json.dumps([doc["version"]])}
            try:
                async with session.post(url, json=doc, headers=h, timeout=aiohttp.ClientTimeout(total=20)) as r:
                    if r.status in [200,201]: pushed+=1; return
                    elif r.status==429: await asyncio.sleep(float(r.headers.get("x-ms-retry-after-ms",200))/1000)
                    else: await asyncio.sleep(0.2)
            except: await asyncio.sleep(0.5*(a+1))
        failed += 1

async def upload_memory(docs, code):
    global pushed, failed
    sem = asyncio.Semaphore(1500)
    conn = aiohttp.TCPConnector(limit=1500, ttl_dns_cache=300)
    t0 = time.time()
    async with aiohttp.ClientSession(connector=conn) as session:
        for i in range(0, len(docs), 500):
            chunk = docs[i:i+500]
            await asyncio.gather(*[upsert(session, d, sem) for d in chunk])
            print(f"{code}: {min(i+500,len(docs))}/{len(docs)} ({(min(i+500,len(docs))/len(docs))*100:.0f}%)")
    print(f"Uploaded {pushed} verses in {time.time()-t0:.0f}s")

if __name__ == "__main__":
    print("Downloading Finnish PR...")
    r = requests.get("https://ebible.org/Scriptures/fin_usfm.zip")
    with zipfile.ZipFile(BytesIO(r.content)) as z:
        all_verses = []
        for filename in z.namelist():
            if filename.endswith(".usfm"):
                with z.open(filename) as f:
                    content = f.read().decode("utf-8-sig", errors="ignore")
                    all_verses.extend(parse_usfm_content(content, "FINPR"))
    print(f"Extracted {len(all_verses)} verses. Starting upload...")
    asyncio.run(upload_memory(all_verses, "FINPR"))
