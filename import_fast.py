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
SOURCE_FILE    = r"C:\Users\Infobell\.gemini\antigravity\scratch\kjv-nkjv-comparison\text.txt"

# ── Configurations ────────────────────────────────
LANGS = {
    "zh": {"col_idx": 4, "name": "Chinese (Union)"},
    "id": {"col_idx": 5, "name": "Indonesian (TB)"}
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

def import_fast():
    if not ASTRA_TOKEN or not ASTRA_ENDPOINT:
        print("❌ Missing credentials")
        return

    client = DataAPIClient(ASTRA_TOKEN)
    db = client.get_database(ASTRA_ENDPOINT, keyspace=ASTRA_KEYSPACE)

    for lang_code, config in LANGS.items():
        coll_name = f"bible_{lang_code}"
        print(f"\n🚀 Fast Import: {config['name']} -> '{coll_name}'")
        
        # Ensure collection exists
        if coll_name not in db.list_collection_names():
            db.create_collection(coll_name)
        
        collection = db.get_collection(coll_name)
        
        print(f"🗑️  Clearing '{coll_name}'...")
        try:
            collection.delete_many({})
        except Exception as e:
            print(f"⚠️  Clearing error (might be empty): {e}")
        
        batch = []
        BATCH_SIZE = 80
        total = 0
        
        with open(SOURCE_FILE, 'r', encoding='utf-8') as f:
            for idx, line in enumerate(f):
                parts = line.strip().split('\t')
                if len(parts) <= config["col_idx"]: continue
                
                try:
                    book_id = int(parts[0])
                    chapter = int(parts[1])
                    verse   = int(parts[2])
                    text    = parts[config["col_idx"]]
                    
                    book_name = BOOK_ORDER[book_id - 1]
                    
                    doc = {
                        "book": book_name,
                        "book_id": book_id,
                        "chapter": chapter,
                        "verse": verse,
                        "text": text,
                        "version": lang_code.upper()
                    }
                    batch.append(doc)
                    
                    if len(batch) >= BATCH_SIZE:
                        collection.insert_many(batch)
                        total += len(batch)
                        batch = []
                        if total % 4000 == 0:
                            print(f"📦 {total} verses...")
                            
                except Exception:
                    continue
                    
        if batch:
            collection.insert_many(batch)
            total += len(batch)
            
        print(f"✅ {config['name']} Complete: {total} verses.")

if __name__ == "__main__":
    import_fast()
