import os
import json
import sys
import time
from dotenv import load_dotenv
from astrapy import DataAPIClient

# ── Load credentials ──────────────────────────────
load_dotenv(".env.local")

ASTRA_TOKEN    = os.getenv("ASTRA_DB_APPLICATION_TOKEN") or os.getenv("ASTRA_DB_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")
ASTRA_KEYSPACE = os.getenv("ASTRA_DB_NAMESPACE") or "default_keyspace"
COLLECTION     = "bible_nkjv"
NKJV_FILE_PATH = r"C:\Users\Infobell\.gemini\antigravity\scratch\kjv-nkjv-comparison\nkjv.json"

# ── Book ordering (1-indexed) ──────────────────────
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
BOOK_ID_MAP = {name: idx+1 for idx, name in enumerate(BOOK_ORDER)}

def validate_credentials():
    if not ASTRA_TOKEN or not ASTRA_ENDPOINT:
        print("❌ Missing credentials in .env.local")
        sys.exit(1)
    if not os.path.exists(NKJV_FILE_PATH):
        print(f"❌ NKJV file not found: {NKJV_FILE_PATH}")
        sys.exit(1)

def get_collection():
    client = DataAPIClient(ASTRA_TOKEN)
    db = client.get_database(ASTRA_ENDPOINT, keyspace=ASTRA_KEYSPACE)
    
    existing = db.list_collection_names()
    if COLLECTION not in existing:
        print(f"🆕 Creating collection '{COLLECTION}'...")
        db.create_collection(COLLECTION)
    
    return db.get_collection(COLLECTION)

def import_nkjv():
    validate_credentials()
    print(f"🚀 Starting NKJV import from {NKJV_FILE_PATH}")
    
    collection = get_collection()
    
    # Optional: Clear collection
    print("🗑️   Deleting existing documents in 'bible_nkjv' for a fresh start...")
    collection.delete_many({})
    
    with open(NKJV_FILE_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    total_inserted = 0
    BATCH_SIZE = 50 # Smaller batch size for stability
    
    for book_data in data.get("books", []):
        book_name = book_data.get("name")
        if book_name == "Psalm":
            book_name = "Psalms"
            
        book_id = BOOK_ID_MAP.get(book_name, 0)
        print(f"📖 Processing {book_name}...", end=" ", flush=True)
        
        all_verses = []
        for chapter_data in book_data.get("chapters", []):
            chapter_num = chapter_data.get("num")
            for verse_data in chapter_data.get("verses", []):
                verse_num = verse_data.get("num")
                text = verse_data.get("text", "").strip()
                
                all_verses.append({
                    "book": book_name,
                    "book_id": book_id,
                    "chapter": chapter_num,
                    "verse": verse_num,
                    "text": text,
                    "version": "NKJV"
                })
        
        # Insert in batches
        for i in range(0, len(all_verses), BATCH_SIZE):
            batch = all_verses[i : i + BATCH_SIZE]
            collection.insert_many(batch)
            total_inserted += len(batch)
        
        print(f"✅ {len(all_verses)} verses.")
        time.sleep(0.1) # Polite delay
        
    print("\n" + "="*50)
    print(f"🎉 Import complete!")
    print(f"Total verses inserted: {total_inserted}")
    print("="*50)

if __name__ == "__main__":
    import_nkjv()
