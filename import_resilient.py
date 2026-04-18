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

BOOK_MAP = {
    "Song of Songs": "Song of Solomon"
}

def get_db():
    client = DataAPIClient(ASTRA_TOKEN)
    return client.get_database(ASTRA_ENDPOINT, keyspace=ASTRA_KEYSPACE)

def ensure_collection(db, coll_name):
    # Check if empty, and maybe valid
    if coll_name in db.list_collection_names():
        coll = db.get_collection(coll_name)
        try:
            sample = list(coll.find({}, limit=1))
            if sample:
                return coll, True
        except Exception as e:
            print(f"⚠️  Collection '{coll_name}' seems corrupted: {e}. Dropping it.")
            db.drop_collection(coll_name)
            time.sleep(10)
    else:
        print(f"🛠️  Creating '{coll_name}'...")
        db.create_collection(coll_name)
        print("⏳ Waiting 15s for indexes to be ready...")
        time.sleep(15)

    if coll_name in db.list_collection_names():
        return db.get_collection(coll_name), False
    raise Exception(f"Failed to create collection {coll_name}")

def import_world(db, lang_code, filename):
    coll_name = f"bible_{lang_code}"
    file_path = os.path.join(WORLD_JSON_DIR, filename)
    print(f"\n🌍 IMPORTING WORLD LANGUAGE: {lang_code.upper()} from {filename}")
    
    collection, has_data = ensure_collection(db, coll_name)
    if has_data:
        print(f"⏩ {lang_code.upper()} already has data. Skipping.")
        return

    with open(file_path, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
    
    total = 0
    batch = []
    
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
                
                if len(batch) >= 15:
                    retry_insert(collection, batch)
                    total += len(batch)
                    batch = []
                    time.sleep(0.05)
    
    if batch:
        retry_insert(collection, batch)
        total += len(batch)
    
    print(f"✅ {lang_code.upper()} Complete: {total} verses.")

def import_regional(db, lang_code, source_dir):
    coll_name = f"bible_{lang_code}"
    print(f"\n🏛️  IMPORTING REGIONAL LANGUAGE: {lang_code.upper()} from {source_dir}")
    
    collection, has_data = ensure_collection(db, coll_name)
    if has_data:
        print(f"⏩ {lang_code.upper()} already has data. Skipping.")
        return

    total = 0
    for b_idx, book_name in enumerate(BOOK_ORDER):
        file_name = f"{book_name}.json"
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
                if len(batch) >= 15:
                    retry_insert(collection, batch)
                    total += len(batch)
                    batch = []
                    time.sleep(0.05)
        
        if batch:
            retry_insert(collection, batch)
            total += len(batch)
            
        print(f"   📦 {book_name} complete...")

    print(f"✅ {lang_code.upper()} Complete: {total} verses.")

def retry_insert(collection, batch, retries=5):
    attempt = 0
    while attempt < retries:
        try:
            collection.insert_many(batch)
            return
        except Exception as e:
            attempt += 1
            print(f"⚠️  Insert error (Attempt {attempt}): {e}")
            if attempt >= retries:
                raise
            time.sleep(2 ** attempt)  # Exponential backoff

if __name__ == "__main__":
    db = get_db()
    
    targets = [
        ("ar", "ar_svd.json"),
        ("ru", "ru_synodal.json"),
        ("ko", "ko_ko.json")
    ]
    for lang, fname in targets:
        try:
            import_world(db, lang, fname)
        except Exception as e:
            print(f"❌ Failed to process {lang}: {e}")

    regional_targets = [
        ("te", TELUGU_DIR),
        ("ta", TAMIL_DIR)
    ]
    for lang, sdir in regional_targets:
        try:
            import_regional(db, lang, sdir)
        except Exception as e:
            print(f"❌ Failed to process {lang}: {e}")
