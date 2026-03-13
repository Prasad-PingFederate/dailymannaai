import os
import json
import time
from dotenv import load_dotenv
from astrapy import DataAPIClient

# ── Load credentials ──────────────────────────────
load_dotenv(".env.local")

ASTRA_TOKEN    = os.getenv("ASTRA_DB_APPLICATION_TOKEN") or os.getenv("ASTRA_DB_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")
ASTRA_KEYSPACE = os.getenv("ASTRA_DB_NAMESPACE") or "default_keyspace"

WORLD_JSON_DIR = r"C:\Users\Infobell\.gemini\antigravity\scratch\world-bibles\json"
TELUGU_DIR     = r"C:\Users\Infobell\.gemini\antigravity\scratch\Bible-telugu"
TAMIL_DIR      = r"C:\Users\Infobell\.gemini\antigravity\scratch\Bible-tamil"

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

# Map specific file names to standard book names if needed
BOOK_MAP = {
    "Song of Songs": "Song of Solomon"
}

def get_db():
    client = DataAPIClient(ASTRA_TOKEN)
    return client.get_database(ASTRA_ENDPOINT, keyspace=ASTRA_KEYSPACE)

def import_world_json(db, lang_code, filename):
    coll_name = f"bible_{lang_code}"
    file_path = os.path.join(WORLD_JSON_DIR, filename)
    
    print(f"\n🌍 IMPORTING WORLD LANGUAGE: {lang_code.upper()} from {filename}")
    
    if coll_name not in db.list_collection_names():
        db.create_collection(coll_name)
    
    collection = db.get_collection(coll_name)
    
    # Check if data exists - we'll drop it to be sure it's clean for failed ones
    print(f"🔥 Clearing '{coll_name}' for recovery...")
    collection.delete_many({})
    
    with open(file_path, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
    
    total = 0
    batch = []
    BATCH_SIZE = 15 # Conservative
    
    for b_idx, book_data in enumerate(data):
        if b_idx >= 66: break
        book_name = BOOK_ORDER[b_idx]
        
        for c_idx, verses in enumerate(book_data["chapters"]):
            for v_idx, text in enumerate(verses):
                doc = {
                    "book": book_name,
                    "book_id": b_idx + 1,
                    "chapter": c_idx + 1,
                    "verse": v_idx + 1,
                    "text": text.strip(),
                    "version": lang_code.upper()
                }
                batch.append(doc)
                
                if len(batch) >= BATCH_SIZE:
                    collection.insert_many(batch)
                    total += len(batch)
                    batch = []
                    time.sleep(0.05)
    
    if batch:
        collection.insert_many(batch)
        total += len(batch)
    
    print(f"✅ {lang_code.upper()} Complete: {total} verses.")

def import_regional_json(db, lang_code, source_dir):
    coll_name = f"bible_{lang_code}"
    print(f"\n🏛️  IMPORTING REGIONAL LANGUAGE: {lang_code.upper()} from {source_dir}")
    
    if coll_name not in db.list_collection_names():
        db.create_collection(coll_name)
    
    collection = db.get_collection(coll_name)
    collection.delete_many({}) # Clean start
    
    total = 0
    
    for b_idx, book_name in enumerate(BOOK_ORDER):
        # Look for the file
        file_name = f"{book_name}.json"
        
        # Check special cases (e.g. Song of Songs)
        inv_map = {v: k for k, v in BOOK_MAP.items()}
        if book_name in inv_map:
            alt_name = f"{inv_map[book_name]}.json"
            if os.path.exists(os.path.join(source_dir, alt_name)):
                file_name = alt_name

        file_path = os.path.join(source_dir, file_name)
        if not os.path.exists(file_path):
            print(f"⚠️  Skipping {book_name} (file not found)")
            continue

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        batch = []
        BATCH_SIZE = 15
        
        for ch_data in data["chapters"]:
            chapter_num = int(ch_data["chapter"])
            for verse_data in ch_data["verses"]:
                doc = {
                    "book": book_name,
                    "book_id": b_idx + 1,
                    "chapter": chapter_num,
                    "verse": int(verse_data["verse"]),
                    "text": verse_data["text"].strip(),
                    "version": lang_code.upper()
                }
                batch.append(doc)
                
                if len(batch) >= BATCH_SIZE:
                    collection.insert_many(batch)
                    total += len(batch)
                    batch = []
                    time.sleep(0.05)
        
        if batch:
            collection.insert_many(batch)
            total += len(batch)
            
        print(f"   📦 {book_name} complete...")

    print(f"✅ {lang_code.upper()} Complete: {total} verses.")

if __name__ == "__main__":
    db = get_db()
    
    # 1. Fix the ones that failed/timed out
    for lang, fname in [("ar", "ar_svd.json"), ("ru", "ru_synodal.json"), ("ko", "ko_ko.json")]:
        try:
            import_world_json(db, lang, fname)
        except Exception as e:
            print(f"❌ Failed to fix {lang}: {e}")

    # 2. Import Telugu and Tamil
    try:
        import_regional_json(db, "te", TELUGU_DIR)
    except Exception as e: print(f"❌ Failed Telugu: {e}")
    
    try:
        import_regional_json(db, "ta", TAMIL_DIR)
    except Exception as e: print(f"❌ Failed Tamil: {e}")
