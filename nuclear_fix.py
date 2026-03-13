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

def nuclear_reset(db, coll_names):
    for name in coll_names:
        print(f"🔥 Nuclear Drop: {name}")
        try:
            db.drop_collection(name)
        except:
            pass
    
    print("⏳ Waiting 30s for database to clear metadata...")
    time.sleep(30)
    
    for name in coll_names:
        print(f"🏗️  Recreating: {name}")
        db.create_collection(name)
    
    print("⏳ Waiting 30s for indices to initialize...")
    time.sleep(30)

def safe_insert(collection, batch):
    for attempt in range(5):
        try:
            collection.insert_many(batch)
            return True
        except Exception as e:
            print(f"⚠️  Retry insert ({attempt+1}): {e}")
            time.sleep(5)
    return False

def import_world(db, lang, filename):
    print(f"\n🌍 Processing {lang.upper()}...")
    collection = db.get_collection(f"bible_{lang}")
    
    with open(os.path.join(WORLD_JSON_DIR, filename), 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
    
    batch = []
    total = 0
    for b_idx, book_data in enumerate(data):
        if b_idx >= 66: break
        for c_idx, verses in enumerate(book_data["chapters"]):
            for v_idx, text in enumerate(verses):
                batch.append({
                    "book": BOOK_ORDER[b_idx],
                    "book_id": b_idx+1,
                    "chapter": c_idx+1,
                    "verse": v_idx+1,
                    "text": text.strip(),
                    "version": lang.upper()
                })
                if len(batch) >= 50:
                    if safe_insert(collection, batch):
                        total += len(batch)
                    batch = []
                    time.sleep(0.1) # Throttling
    if batch:
        if safe_insert(collection, batch):
            total += len(batch)
    print(f"✅ {lang.upper()} Done: {total} verses")

def import_regional(db, lang, source_dir):
    print(f"\n🏛️  Processing {lang.upper()}...")
    collection = db.get_collection(f"bible_{lang}")
    
    total = 0
    batch = []
    for b_idx, book_name in enumerate(BOOK_ORDER):
        f_name = f"{book_name}.json"
        if book_name == "Song of Solomon": f_name = "Song of Songs.json"
        
        path = os.path.join(source_dir, f_name)
        if not os.path.exists(path): continue
        
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        for ch in data["chapters"]:
            ch_num = int(ch["chapter"])
            for v in ch["verses"]:
                batch.append({
                    "book": book_name,
                    "book_id": b_idx+1,
                    "chapter": ch_num,
                    "verse": int(v["verse"]),
                    "text": v["text"].strip(),
                    "version": lang.upper()
                })
                if len(batch) >= 50:
                    if safe_insert(collection, batch):
                        total += len(batch)
                    batch = []
                    time.sleep(0.1)
    if batch:
        if safe_insert(collection, batch):
            total += len(batch)
    print(f"✅ {lang.upper()} Done: {total} verses")

if __name__ == "__main__":
    db = get_db()
    langs = ["ru", "ko", "te", "ta"]
    colls = [f"bible_{l}" for l in langs]
    
    nuclear_reset(db, colls)
    
    import_world(db, "ru", "ru_synodal.json")
    import_world(db, "ko", "ko_ko.json")
    import_regional(db, "te", TELUGU_DIR)
    import_regional(db, "ta", TAMIL_DIR)
