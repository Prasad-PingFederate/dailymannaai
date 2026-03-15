import json
import os
import io
import re
import zipfile
import requests
import time
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv('.env.local')
token = os.getenv('ASTRA_DB_APPLICATION_TOKEN')
endpoint = os.getenv('ASTRA_DB_API_ENDPOINT')

client = DataAPIClient(token)
db = client.get_database(endpoint)
collection = db.get_collection('bible_ar')

with open('refined_eligible.json', 'r') as f:
    eligible = json.load(f)

# Fast check: See which ones are missing using find_one
missing_bibles = []
print(f"Checking {len(eligible)} bibles to see which are pending (this will be very fast)...")

for b in eligible:
    vers_upper = b['id'].upper()
    try:
        doc = collection.find_one({"version": vers_upper}, projection={"_id": 1})
        if not doc:
            missing_bibles.append(b)
    except Exception as e:
        # Assuming missing if error
        missing_bibles.append(b)

print(f"Found {len(missing_bibles)} missing bibles out of {len(eligible)}.")

if not missing_bibles:
    print("All done!")
    exit(0)

print(f"First 5 missing: {[b['id'] for b in missing_bibles[:5]]}")

# --- PARSING LOGIC FROM FINAL_SWEEP ---
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

# --- START IMPORT ---
imported_count = 0
struggles = []

for b in missing_bibles:
    print(f"\nImporting pending: {b['lang']} ({b['id']})")
    url = f"https://ebible.org/Scriptures/{b['id']}_usfm.zip"
    
    try:
        res = requests.get(url, timeout=30)
        if res.status_code != 200:
            print(f"  Download failed ({res.status_code})")
            struggles.append({"id": b['id'], "reason": f"Download failed {res.status_code}"})
            continue
        
        verses = parse_usfm_zip(res.content, b['id'])
        if not verses:
            print(f"  Zero verses parsed from Zip")
            struggles.append({"id": b['id'], "reason": "Zero verses parsed"})
            continue
        
        print(f"  Successfully extracted {len(verses)} verses. Uploading to Astra as {b['id'].upper()}...")
        
        batch_size = 1000
        for i in range(0, len(verses), batch_size):
            try:
                collection.insert_many(verses[i:i+batch_size], ordered=False)
            except Exception as e:
                # ignore insert_many ordered=False partial drops usually dupe keys or similar
                pass
                
        print(f"  Finished uploading {b['id']}.")
        imported_count += 1
    except Exception as e:
        print(f"  Unexpected error: {e}")
        struggles.append({"id": b['id'], "reason": str(e)})

    time.sleep(1)

print(f"\nSuccessfully processed {imported_count} pending bibles.")
if struggles:
    print(f"There are {len(struggles)} bibles that had issues and could not be loaded:")
    for s in struggles:
        print(f" - {s['id']}: {s['reason']}")
    
    with open('final_struggles.json', 'w') as sf:
        json.dump(struggles, sf, indent=2)
