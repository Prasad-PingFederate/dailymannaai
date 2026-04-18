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

def clean_usfm_text(text):
    text = re.sub(r'\\f.*?\\f\*', '', text)
    text = re.sub(r'\\fe.*?\\fe\*', '', text)
    text = re.sub(r'\\x.*?\\x\*', '', text)
    text = re.sub(r'\\[a-z]+\d*\*?', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

BOOK_MAP = {
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
    "MRK":"Mark","LUK":"Luke","JHN":"John","ACT":"Acts","ROM":"Romans",
    "1CO":"1 Corinthians","2CO":"2 Corinthians","GAL":"Galatians",
    "EPH":"Ephesians","PHP":"Philippians","COL":"Colossians",
    "1TH":"1 Thessalonians","2TH":"2 Thessalonians","1TI":"1 Timothy",
    "2TI":"2 Timothy","TIT":"Titus","PHM":"Philemon","HEB":"Hebrews",
    "JAS":"James","1PE":"1 Peter","2PE":"2 Peter","1JN":"1 John",
    "2JN":"2 John","3JN":"3 John","JUD":"Jude","REV":"Revelation"
}

def parse_usfm_zip(zip_bytes, version_code):
    verses = []
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
        usfm_files = [f for f in z.namelist() if f.lower().endswith(('.usfm', '.sfm'))]
        usfm_files.sort()
        for fname in usfm_files:
            try:
                raw = z.read(fname).decode('utf-8', errors='replace')
            except Exception: continue
            id_match = re.search(r'\\id\s+([A-Z1-3]{3})', raw)
            if not id_match: continue
            book_code = id_match.group(1).upper()
            book_name = BOOK_MAP.get(book_code)
            if not book_name: continue
            
            current_chapter = 0
            current_verse_num = 0
            current_text = ""
            
            def flush(ch, vn, txt, vlist):
                txt = clean_usfm_text(txt)
                if txt and ch > 0 and vn > 0:
                    vlist.append({
                        "book": book_name,
                        "chapter": ch,
                        "verse": vn,
                        "text": txt,
                        "version": version_code.upper()
                    })

            for line in raw.splitlines():
                line = line.strip()
                if not line: continue
                c_match = re.match(r'\\c\s+(\d+)', line)
                if c_match:
                    flush(current_chapter, current_verse_num, current_text, verses)
                    current_chapter = int(c_match.group(1))
                    current_verse_num = 0
                    current_text = ""
                    continue
                v_match = re.match(r'\\v\s+(\d+)\s*(.*)', line)
                if v_match:
                    flush(current_chapter, current_verse_num, current_text, verses)
                    current_verse_num = int(v_match.group(1))
                    current_text = v_match.group(2) or ""
                    continue
                if line.startswith('\\') and not (line.startswith('\\q') or line.startswith('\\m')):
                    continue
                if current_verse_num > 0:
                    current_text += " " + line
            flush(current_chapter, current_verse_num, current_text, verses)
    return verses

def run_import(limit=250):
    client = DataAPIClient(ASTRA_TOKEN)
    db = client.get_database(ASTRA_ENDPOINT)
    collection = db.get_collection(TARGET_COLLECTION)

    # Load candidates
    with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\refined_eligible.json", 'r') as f:
        eligible = json.load(f)

    count_imported = 0
    # Add a set for faster checking if possible, but version check is safer
    
    for item in eligible:
        if count_imported >= limit: break
        
        bid = item['id']
        vcode = bid.upper()
        
        # Check if exists in DB
        try:
            if list(collection.find({"version": vcode}, limit=1)):
                # print(f"Skipping {bid} - already in DB")
                continue
        except Exception: 
            pass
            
        print(f"\nMaster Expansion: {item['lang']} ({bid})")
        url = f"https://ebible.org/Scriptures/{bid}_usfm.zip"
        try:
            res = requests.get(url, timeout=45)
            if res.status_code != 200: 
                print(f"   Failed to download {bid}")
                continue
            verses = parse_usfm_zip(res.content, bid)
            if not verses: 
                print(f"   No verses parsed for {bid}")
                continue
            
            print(f"   Found {len(verses)} verses. Importing...")
            batch_size = 1000
            for i in range(0, len(verses), batch_size):
                collection.insert_many(verses[i:i+batch_size])
            count_imported += 1
            print(f"   Success! ({count_imported}/{limit})")
            # Small sleep to be polite to the API
            time.sleep(0.5)
        except Exception as e: 
            print(f"   Error: {e}")
            continue

if __name__ == "__main__":
    run_import(limit=250)
