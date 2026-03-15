import os
import io
import re
import zipfile
import requests
import time
import json
from dotenv import load_dotenv
from astrapy import DataAPIClient

# Final Comprehensive Importer
# This script will attempt to import EVERY remaining bible from refined_eligible.json

load_dotenv(".env.local")

ASTRA_TOKEN   = os.getenv("ASTRA_DB_TOKEN") or os.getenv("ASTRA_DB_APPLICATION_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")
TARGET_COLLECTION = "bible_ar"

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

def clean_usfm_text(text):
    text = re.sub(r'\\f.*?\\f\*', '', text)
    text = re.sub(r'\\fe.*?\\fe\*', '', text)
    text = re.sub(r'\\x.*?\\x\*', '', text)
    text = re.sub(r'\\[a-z]+\d*\*?', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def parse_usfm_zip(zip_bytes, version_code):
    verses = []
    try:
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
    except Exception: pass
    return verses

def run_sweep():
    client = DataAPIClient(ASTRA_TOKEN)
    db = client.get_database(ASTRA_ENDPOINT)
    collection = db.get_collection(TARGET_COLLECTION)

    with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\refined_eligible.json", 'r') as f:
        eligible = json.load(f)

    print(f"Starting Final Sweep of {len(eligible)} bibles...")
    
    success_count = 0
    struggles = []
    skip_count = 0

    for item in eligible:
        vcode = item['id'].upper()
        
        # Check if exists in DB (efficient using find_one with projection)
        try:
            if list(collection.find({"version": vcode}, limit=1, projection={"_id": 1})):
                skip_count += 1
                if skip_count % 50 == 0:
                    print(f"   (Skipped {skip_count} already imported bibles...)")
                continue
        except Exception:
            pass
            
        print(f"\nSweep: {item['lang']} ({item['id']})")
        url = f"https://ebible.org/Scriptures/{item['id']}_usfm.zip"
        
        try:
            res = requests.get(url, timeout=30)
            if res.status_code != 200:
                print(f"   [STRUGGLE] Download failed ({res.status_code})")
                struggles.append({"id": item['id'], "reason": f"Download failed {res.status_code}"})
                continue
            
            verses = parse_usfm_zip(res.content, item['id'])
            if not verses:
                print(f"   [STRUGGLE] Zero verses parsed")
                struggles.append({"id": item['id'], "reason": "Zero verses"})
                continue
            
            print(f"   Success! Found {len(verses)} verses. Importing...")
            batch_size = 1000
            for i in range(0, len(verses), batch_size):
                collection.insert_many(verses[i:i+batch_size])
            
            success_count += 1
            print(f"   Done. Total imported in this sweep: {success_count}")
            
        except Exception as e:
            print(f"   [STRUGGLE] Unexpected error: {e}")
            struggles.append({"id": item['id'], "reason": str(e)})
            continue

    print("\n" + "="*30)
    print(f"Sweep Complete!")
    print(f"New Successes: {success_count}")
    print(f"Struggles recorded: {len(struggles)}")
    
    if struggles:
        with open("struggle_list.json", "w") as sf:
            json.dump(struggles, sf, indent=2)
        print("Logged struggles to struggle_list.json")

if __name__ == "__main__":
    run_sweep()
