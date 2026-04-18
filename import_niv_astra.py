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
COLLECTION     = "bible_niv"
NIV_DATA_DIR   = r"C:\Users\Infobell\.gemini\antigravity\scratch\Bible-niv"

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
    if not os.path.exists(NIV_DATA_DIR):
        print(f"❌ NIV data directory not found: {NIV_DATA_DIR}")
        sys.exit(1)

def get_collection():
    client = DataAPIClient(ASTRA_TOKEN)
    db = client.get_database(ASTRA_ENDPOINT, keyspace=ASTRA_KEYSPACE)
    
    existing = db.list_collection_names()
    if COLLECTION not in existing:
        print(f"🆕 Creating collection '{COLLECTION}'...")
        db.create_collection(COLLECTION)
    
    return db.get_collection(COLLECTION)

def import_niv():
    validate_credentials()
    print(f"🚀 Starting NIV import from {NIV_DATA_DIR}")
    
    collection = get_collection()
    
    # Optional: Clear collection
    print(f"🗑️   Deleting existing documents in '{COLLECTION}' for a fresh start...")
    collection.delete_many({})
    
    total_inserted = 0
    BATCH_SIZE = 50
    
    # Files are named like "Genesis.json", "1 Samuel.json", etc.
    # We want to process them in Biblical order if possible, or just all files.
    files = [f for f in os.listdir(NIV_DATA_DIR) if f.endswith('.json') and f != 'Books.json']
    
    # Sort files to match BOOK_ORDER if possible
    def get_order(filename):
        name = filename.replace('.json', '')
        if name == "Song Of Solomon": name = "Song of Solomon"
        return BOOK_ID_MAP.get(name, 999)
    
    files.sort(key=get_order)
    
    for filename in files:
        filepath = os.path.join(NIV_DATA_DIR, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            book_data = json.load(f)
            
        book_name = book_data.get("book")
        if book_name == "Song Of Solomon":
            book_name = "Song of Solomon"
        
        book_id = BOOK_ID_MAP.get(book_name, 0)
        print(f"📖 Processing {book_name}...", end=" ", flush=True)
        
        all_verses = []
        for chapter_data in book_data.get("chapters", []):
            chapter_num = int(chapter_data.get("chapter", 0))
            for verse_data in chapter_data.get("verses", []):
                verse_num = int(verse_data.get("verse", 0))
                text = verse_data.get("text", "").strip()
                
                all_verses.append({
                    "book": book_name,
                    "book_id": book_id,
                    "chapter": chapter_num,
                    "verse": verse_num,
                    "text": text,
                    "version": "NIV"
                })
        
        # Insert in batches
        for i in range(0, len(all_verses), BATCH_SIZE):
            batch = all_verses[i : i + BATCH_SIZE]
            collection.insert_many(batch)
            total_inserted += len(batch)
        
        print(f"✅ {len(all_verses)} verses.")
        time.sleep(0.05)
        
    print("\n" + "="*50)
    print(f"🎉 NIV Import complete!")
    print(f"Total verses inserted: {total_inserted}")
    print("="*50)

if __name__ == "__main__":
    import_niv()
