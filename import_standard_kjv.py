import os
import sys
import time
from dotenv import load_dotenv
from astrapy import DataAPIClient

# ── Load credentials ──────────────────────────────
load_dotenv(".env.local")

ASTRA_TOKEN    = os.getenv("ASTRA_DB_APPLICATION_TOKEN") or os.getenv("ASTRA_DB_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")
ASTRA_KEYSPACE = os.getenv("ASTRA_DB_NAMESPACE") or "default_keyspace"
COLLECTION     = "bible_kjv"
KJV_SOURCE     = r"C:\Users\Infobell\.gemini\antigravity\scratch\kjv-nkjv-comparison\text.txt"

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

def validate():
    if not ASTRA_TOKEN or not ASTRA_ENDPOINT:
        print("❌ Missing credentials")
        sys.exit(1)
    if not os.path.exists(KJV_SOURCE):
        print(f"❌ Source file not found: {KJV_SOURCE}")
        sys.exit(1)

def import_kjv():
    validate()
    print(f"🚀 Importing Standard KJV from {KJV_SOURCE}")
    
    client = DataAPIClient(ASTRA_TOKEN)
    db = client.get_database(ASTRA_ENDPOINT, keyspace=ASTRA_KEYSPACE)
    
    existing = db.list_collection_names()
    if COLLECTION not in existing:
        db.create_collection(COLLECTION)
    
    collection = db.get_collection(COLLECTION)
    
    print(f"🗑️  Clearing collection '{COLLECTION}'...")
    collection.delete_many({})
    
    batch = []
    BATCH_SIZE = 100
    total_inserted = 0
    
    with open(KJV_SOURCE, 'r', encoding='utf-8') as f:
        for idx, line in enumerate(f):
            parts = line.strip().split('\t')
            if len(parts) < 4: continue
            
            try:
                book_id = int(parts[0])
                chapter = int(parts[1])
                verse   = int(parts[2])
                text    = parts[3] # English column
                
                book_name = BOOK_ORDER[book_id - 1]
                
                doc = {
                    "book": book_name,
                    "book_id": book_id,
                    "chapter": chapter,
                    "verse": verse,
                    "text": text,
                    "version": "KJV"
                }
                batch.append(doc)
                
                if len(batch) >= BATCH_SIZE:
                    collection.insert_many(batch)
                    total_inserted += len(batch)
                    batch = []
                    if (total_inserted // BATCH_SIZE) % 50 == 0:
                        print(f"📦 Inserted {total_inserted} verses...")
                        
            except (ValueError, IndexError) as e:
                print(f"⚠️  Skipping line {idx+1}: {e}")
                
    if batch:
        collection.insert_many(batch)
        total_inserted += len(batch)
        
    print(f"\n✅ Total Verses Imported: {total_inserted}")

if __name__ == "__main__":
    import_kjv()
