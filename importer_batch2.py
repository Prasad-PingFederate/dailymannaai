import os
import io
import re
import zipfile
import requests
import time
import json
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")

ASTRA_TOKEN   = os.getenv("ASTRA_DB_TOKEN") or os.getenv("ASTRA_DB_APPLICATION_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")
TARGET_COLLECTION = "bible_ar"

with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\second_import_batch.json", 'r', encoding='utf-8') as f:
    BATCH_BIBLES = json.load(f)

BOOK_ORDER = [
    "GEN","EXO","LEV","NUM","DEU","JOS","JDG","RUT","1SA","2SA",
    "1KI","2KI","1CH","2CH","EZR","NEH","EST","JOB","PSA","PRO",
    "ECC","SNG","ISA","JER","LAM","EZK","DAN","HOS","JOL","AMO",
    "OBA","JON","MIC","NAM","HAB","ZEP","HAG","ZEC","MAL",
    "MAT","MRK","LUK","JHN","ACT","ROM","1CO","2CO","GAL","EPH",
    "PHP","COL","1TH","2TH","1TI","2TI","TIT","PHM","HEB","JAS",
    "1PE","2PE","1JN","2JN","3JN","JUD","REV"
]

BOOK_NAMES = {
    "GEN":"Genesis","EXO":"Exodus","LEV":"Leviticus","NUM":"Numbers",
    "DEU":"Deuteronomy","JOS":"Joshua","JDG":"Judges","RUT":"Ruth",
    "1SA":"1 Samuel","2SA":"2 Samuel","1KI":"1 Kings","2KI":"2 Kings",
    "1CH":"1 Chronicles","2CH":"2 Chronicles","EZR":"Ezra","NEH":"Nehemiah",
    "EST":"Esther","JOB":"Job","PSA":"Psalms","PRO":"Proverbs",
    "ECC":"Ecclesiastes","SNG":"Song of Solomon","ISA":"Isaiah",
    "JER":"Jeremiah","LAM":"Lamentations","EZK":"Ezekiel","DAN":"Daniel",
    "HOS":"Hosea","JOL":"Joel","AMO":"Amos","OBA":"Obadiah","JON":"Jonah",
    "MIC":"Micah","NAM":"Nahum","HAB":"Habakkuk","ZEP":"Zephaniah",
    "HAG":"Haggai","ZEC":"Zechariah","MAL":"Malachi","MAT":"Matthew",
    "MRK":"Mark","LUK":"Luke","JJN":"John","ACT":"Acts","ROM":"Romans",
    "1CO":"1 Corinthians","2CO":"2 Corinthians","GAL":"Galatians",
    "EPH":"Ephesians","PHP":"Philippians","COL":"Colossians",
    "1TH":"1 Thessalonians","2TH":"2 Thessalonians","1TI":"1 Timothy",
    "2TI":"2 Timothy","TIT":"Titus","PHM":"Philemon","HEB":"Hebrews",
    "JAS":"James","1PE":"1 Peter","2PE":"2 Peter","1JN":"1 John",
    "2JN":"2 John","3JN":"3 John","JUD":"Jude","REV":"Revelation"
}

def clean_usfm_text(text):
    text = re.sub(r'\\f.*?\\f\*', '', text)
    text = re.sub(r'\\fe.*?\\fe\*', '', text)
    text = re.sub(r'\\x.*?\\x\*', '', text)
    text = re.sub(r'\\[a-z]+\d*\*?', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def parse_usfm_zip(zip_bytes, version_code):
    verses = []
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
        usfm_files = [f for f in z.namelist() if f.lower().endswith(('.usfm', '.sfm'))]
        usfm_files.sort()
        for fname in usfm_files:
            try:
                raw = z.read(fname).decode('utf-8', errors='replace')
            except Exception:
                continue
            id_match = re.search(r'\\id\s+([A-Z1-3]{3})', raw)
            if not id_match: continue
            book_code = id_match.group(1).upper()
            book_name = BOOK_NAMES.get(book_code)
            if not book_name: continue
            book_id = BOOK_ORDER.index(book_code) + 1 if book_code in BOOK_ORDER else 0
            
            current_chapter = 0
            current_verse_num = 0
            current_text = ""
            
            def flush(ch, vn, txt, bkid, bkname, ver, vlist):
                txt = clean_usfm_text(txt)
                if txt and ch > 0 and vn > 0:
                    vlist.append({
                        "book": bkname,
                        "book_id": bkid,
                        "chapter": ch,
                        "verse": vn,
                        "text": txt,
                        "version": ver.upper()
                    })

            for line in raw.splitlines():
                line = line.strip()
                if not line: continue
                c_match = re.match(r'\\c\s+(\d+)', line)
                if c_match:
                    flush(current_chapter, current_verse_num, current_text, book_id, book_name, version_code, verses)
                    current_chapter = int(c_match.group(1))
                    current_verse_num = 0
                    current_text = ""
                    continue
                v_match = re.match(r'\\v\s+(\d+)\s*(.*)', line)
                if v_match:
                    flush(current_chapter, current_verse_num, current_text, book_id, book_name, version_code, verses)
                    current_verse_num = int(v_match.group(1))
                    current_text = v_match.group(2) or ""
                    continue
                if line.startswith('\\') and not (line.startswith('\\q') or line.startswith('\\m')):
                    continue
                if current_verse_num > 0:
                    current_text += " " + line
            flush(current_chapter, current_verse_num, current_text, book_id, book_name, version_code, verses)
    return verses

def main():
    client = DataAPIClient(ASTRA_TOKEN)
    db = client.get_database(ASTRA_ENDPOINT)
    collection = db.get_collection(TARGET_COLLECTION)

    for bible in BATCH_BIBLES:
        bid = bible['id']
        bname = bible['lang']
        v_code = bid.upper()
        
        print(f"\nProcessing Batch 2: {bname} ({bid})")
        
        try:
            if list(collection.find({"version": v_code}, limit=1)):
                print(f"Skipping {v_code} - already in DB")
                continue
        except Exception: pass

        url = f"https://ebible.org/Scriptures/{bid}_usfm.zip"
        print(f"   Downloading {url}...")
        try:
            res = requests.get(url, timeout=60)
            if res.status_code != 200:
                print(f"   Failed to download {url}")
                continue
            verses = parse_usfm_zip(res.content, bid)
        except Exception as e:
            print(f"   Error: {e}")
            continue

        if not verses:
            print("   No verses found.")
            continue

        print(f"   Found {len(verses)} verses. Importing...")
        batch_size = 100
        for i in range(0, len(verses), batch_size):
            batch = verses[i:i+batch_size]
            try:
                collection.insert_many(batch)
            except Exception as e:
                print(f"   Insert error: {e}")
                time.sleep(1)
        print(f"   Successfully imported Batch 2: {bname}")

if __name__ == "__main__":
    main()
