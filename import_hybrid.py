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

# Mapping table for the "Hybrid" storage plan
HYBRID_MAP = {
    "ru": "bible_de",
    "ko": "bible_fr",
    "te": "bible_es",
    "ta": "bible_pt"
}

def get_db():
    client = DataAPIClient(ASTRA_TOKEN)
    return client.get_database(ASTRA_ENDPOINT, keyspace=ASTRA_KEYSPACE)

def safe_batch_insert(collection, batch):
    for attempt in range(5):
        try:
            collection.insert_many(batch)
            return len(batch)
        except Exception as e:
            time.sleep(2)
            if attempt == 4: return 0

def import_world_hybrid(db, lang_code, filename):
    target_coll = HYBRID_MAP[lang_code]
    print(f"\n🌍 WORLD {lang_code.upper()} -> {target_coll}")
    collection = db.get_collection(target_coll)
    
    # Check current count safely
    try:
        curr_count = collection.count_documents(filter={"version": lang_code.upper()})
        if curr_count >= 25000:
            print(f"⏩ {lang_code.upper()} already complete ({curr_count}). Skipping.")
            return
    except:
        pass # If count fails/times out, we assume we need to re-import
    
    collection.delete_many({"version": lang_code.upper()})

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
                    "book_id": b_idx + 1,
                    "chapter": c_idx + 1,
                    "verse": v_idx + 1,
                    "text": text.strip(),
                    "version": lang_code.upper()
                })
                if len(batch) >= 100:
                    total += safe_batch_insert(collection, batch)
                    batch = []
                    if total % 10000 == 0: print(f"   📦 {total} inserted...")

    if batch: total += safe_batch_insert(collection, batch)
    print(f"✅ {lang_code.upper()} Done: {total}")

def import_regional_hybrid(db, lang_code, source_dir):
    target_coll = HYBRID_MAP[lang_code]
    print(f"\n🏛️ REGIONAL {lang_code.upper()} -> {target_coll}")
    collection = db.get_collection(target_coll)
    
    collection.delete_many({"version": lang_code.upper()})

    batch = []
    total = 0
    for b_idx, book_name in enumerate(BOOK_ORDER):
        f_name = f"{book_name}.json"
        if book_name == "Song of Solomon": f_name = "Song of Songs.json"
        path = os.path.join(source_dir, f_name)
        if not os.path.exists(path): continue

        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        for ch in data["chapters"]:
            c_num = int(ch["chapter"])
            for v in ch["verses"]:
                batch.append({
                    "book": book_name,
                    "book_id": b_idx + 1,
                    "chapter": c_num,
                    "verse": int(v["verse"]),
                    "text": v["text"].strip(),
                    "version": lang_code.upper()
                })
                if len(batch) >= 100:
                    total += safe_batch_insert(collection, batch)
                    batch = []
                    if total % 10000 == 0: print(f"   📦 {total} inserted...")

    if batch: total += safe_batch_insert(collection, batch)
    print(f"✅ {lang_code.upper()} Done: {total}")

if __name__ == "__main__":
    db = get_db()
    # RU is already verified complete (30266)
    # import_world_hybrid(db, "ru", "ru_synodal.json")
    
    import_world_hybrid(db, "ko", "ko_ko.json")
    import_regional_hybrid(db, "te", TELUGU_DIR)
    import_regional_hybrid(db, "ta", TAMIL_DIR)
