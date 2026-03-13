import os
import json
import time
from dotenv import load_dotenv
from astrapy import DataAPIClient

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

def safe_batch_insert(collection, batch):
    for attempt in range(6):
        try:
            collection.insert_many(batch)
            return len(batch)
        except Exception as e:
            time.sleep(2 ** attempt)
            if attempt == 5:
                print(f"❌ Failed insert: {e}")
                return 0

def import_world(db, lang_code, filename):
    coll_name = f"bible_{lang_code}"
    print(f"\n🌍 WORLD: {lang_code.upper()}")
    
    if coll_name not in db.list_collection_names():
        db.create_collection(coll_name)
        time.sleep(10)
    collection = db.get_collection(coll_name)
    
    # Simple count check
    if len(list(collection.find({}, limit=10))) > 5:
        print(f"⏩ {lang_code.upper()} already has data. Skipping.")
        return

    with open(os.path.join(WORLD_JSON_DIR, filename), 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
    
    total = 0
    batch = []
    
    for b_idx, book_data in enumerate(data):
        if b_idx >= 66: break
        
        for c_idx, verses in enumerate(book_data["chapters"]):
            for v_idx, text in enumerate(verses):
                batch.append({
                    "book": BOOK_ORDER[b_idx],
                    "book_id": b_idx + 1,
                    "chapter": c_idx + 1,
                    "verse": v_idx + 1,
                    "text": text.strip(),
                    "version": lang_code.upper()
                })
                if len(batch) >= 100:
                    total += safe_batch_insert(collection, batch)
                    batch = []
                    
                    if total % 5000 == 0:
                        print(f"   📦 {total} inserted...")

    if batch:
        total += safe_batch_insert(collection, batch)
        
    print(f"✅ {lang_code.upper()} Complete: {total} verses.")

def import_regional(db, lang_code, source_dir):
    coll_name = f"bible_{lang_code}"
    print(f"\n🏛️ REGIONAL: {lang_code.upper()}")
    
    if coll_name not in db.list_collection_names():
        db.create_collection(coll_name)
        time.sleep(10)
    collection = db.get_collection(coll_name)
    
    # Simple count check
    if len(list(collection.find({}, limit=10))) > 5:
        print(f"⏩ {lang_code.upper()} already has data. Skipping.")
        return

    total = 0
    batch = []
    
    for b_idx, book_name in enumerate(BOOK_ORDER):
        file_name = f"{book_name}.json"
        inv_map = {v: k for k, v in BOOK_MAP.items()}
        if book_name in inv_map:
            alt_name = f"{inv_map[book_name]}.json"
            if os.path.exists(os.path.join(source_dir, alt_name)):
                file_name = alt_name

        file_path = os.path.join(source_dir, file_name)
        if not os.path.exists(file_path):
            continue

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        for ch_data in data["chapters"]:
            chapter_num = int(ch_data["chapter"])
            for verse_data in ch_data["verses"]:
                batch.append({
                    "book": book_name,
                    "book_id": b_idx + 1,
                    "chapter": chapter_num,
                    "verse": int(verse_data["verse"]),
                    "text": verse_data["text"].strip(),
                    "version": lang_code.upper()
                })
                if len(batch) >= 100:
                    total += safe_batch_insert(collection, batch)
                    batch = []
                    
                    if total % 5000 == 0:
                        print(f"   📦 {total} inserted...")

    if batch:
        total += safe_batch_insert(collection, batch)

    print(f"✅ {lang_code.upper()} Complete: {total} verses.")

if __name__ == "__main__":
    db = get_db()
    
    import_world(db, "ar", "ar_svd.json")
    import_world(db, "ru", "ru_synodal.json")
    import_world(db, "ko", "ko_ko.json")
    import_regional(db, "te", TELUGU_DIR)
    import_regional(db, "ta", TAMIL_DIR)
