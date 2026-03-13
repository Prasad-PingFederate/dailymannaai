import os
import sys
import json
import time
from dotenv import load_dotenv
from astrapy import DataAPIClient

# ── Load credentials ──────────────────────────────
load_dotenv(".env.local")

ASTRA_TOKEN    = os.getenv("ASTRA_DB_APPLICATION_TOKEN") or os.getenv("ASTRA_DB_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")
ASTRA_KEYSPACE = os.getenv("ASTRA_DB_NAMESPACE") or "default_keyspace"
JSON_DIR       = r"C:\Users\Infobell\.gemini\antigravity\scratch\world-bibles\json"

# ── Configurations ────────────────────────────────
# Shorthand to JSON filename
LANGS = {
    "es": "es_rvr.json",
    "fr": "fr_apee.json",
    "pt": "pt_nvi.json",
    "de": "de_schlachter.json",
    "ar": "ar_svd.json",
    "ru": "ru_synodal.json",
    "ko": "ko_ko.json"
}

BOOK_ORDER = [
    "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
    "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles",
    "Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes",
    "Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel",
    "Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk",
    "Zephaniah","Haggai","Zechariah","Malachi",
    "Matthew","Mark","Luke","John","Acts","Romans",
    "1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians",
    "Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy",
    "Titus","Philemon","Hebrews","James","1 Peter","2 Peter",
    "1 John","2 John","3 John","Jude","Revelation"
]

def import_json_bibles():
    if not ASTRA_TOKEN or not ASTRA_ENDPOINT:
        print("❌ Missing credentials")
        return

    client = DataAPIClient(ASTRA_TOKEN)
    db = client.get_database(ASTRA_ENDPOINT, keyspace=ASTRA_KEYSPACE)

    for lang_code, filename in LANGS.items():
        coll_name = f"bible_{lang_code}"
        file_path = os.path.join(JSON_DIR, filename)
        
        if not os.path.exists(file_path):
            print(f"⚠️  File not found: {file_path}")
            continue

        print(f"\n🚀 Importing {lang_code.upper()} from {filename} into '{coll_name}'...")
        
        if coll_name not in db.list_collection_names():
            db.create_collection(coll_name)
        
        collection = db.get_collection(coll_name)
        
        # Check if already has data
        try:
            has_data = any(collection.find({}, limit=1))
            if has_data:
                print(f"⏩ Collection '{coll_name}' already has data. Skipping.")
                continue
        except:
            pass

        with open(file_path, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
            
        # Expected structure: list of books (66)
        # Each book: {"abbrev": "...", "chapters": [[v1, v2], [v1, v2]]}
        
        total_inserted = 0
        batch = []
        BATCH_SIZE = 100
        
        for b_idx, book_data in enumerate(data):
            if b_idx >= 66: break
            book_name = BOOK_ORDER[b_idx]
            
            for c_idx, verses in enumerate(book_data["chapters"]):
                chapter_num = c_idx + 1
                for v_idx, verse_text in enumerate(verses):
                    verse_num = v_idx + 1
                    
                    doc = {
                        "book": book_name,
                        "book_id": b_idx + 1,
                        "chapter": chapter_num,
                        "verse": verse_num,
                        "text": verse_text.strip(),
                        "version": lang_code.upper()
                    }
                    batch.append(doc)
                    
                    if len(batch) >= BATCH_SIZE:
                        collection.insert_many(batch)
                        total_inserted += len(batch)
                        batch = []
                        if total_inserted % 5000 == 0:
                            print(f"   📦 {total_inserted} verses...")
                        
        if batch:
            collection.insert_many(batch)
            total_inserted += len(batch)
            
        print(f"✅ {lang_code.upper()} Complete: {total_inserted} verses.")

if __name__ == "__main__":
    import_json_bibles()
