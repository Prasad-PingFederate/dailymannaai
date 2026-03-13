"""
import_kjv_astra.py
────────────────────────────────────────────────────
Fetches the full KJV Bible from:
  https://github.com/aruljohn/Bible-kjv
and imports every verse into DataStax Astra DB
collection  →  bible_kjv   (default_keyspace)

Each document stored:
  {
    "book":    "Genesis",
    "book_id": 1,
    "chapter": 1,
    "verse":   1,
    "text":    "In the beginning God created..."
  }

Run:
  pip install astrapy requests python-dotenv
  python import_kjv_astra.py
────────────────────────────────────────────────────
"""

import os
import sys
import time
import requests
from dotenv import load_dotenv

# ── Load credentials from .env.local ──────────────
load_dotenv(".env.local")
load_dotenv(".env")

ASTRA_TOKEN    = os.getenv("ASTRA_DB_APPLICATION_TOKEN") or os.getenv("ASTRA_DB_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")
ASTRA_KEYSPACE = os.getenv("ASTRA_DB_NAMESPACE") or os.getenv("ASTRA_DB_KEYSPACE") or "default_keyspace"
COLLECTION     = "bible_kjv"

# ── GitHub raw base URL ────────────────────────────
GITHUB_BASE = "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master"

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

# ── Validate credentials ───────────────────────────
def validate_credentials():
    if not ASTRA_TOKEN or not ASTRA_ENDPOINT:
        print("❌  Missing credentials!")
        print(f"   ASTRA_DB_APPLICATION_TOKEN : {'✅ found' if ASTRA_TOKEN else '❌ MISSING'}")
        print(f"   ASTRA_DB_API_ENDPOINT      : {'✅ found' if ASTRA_ENDPOINT else '❌ MISSING'}")
        sys.exit(1)
    print("✅  Credentials loaded.")
    print(f"   Endpoint  : {ASTRA_ENDPOINT}")
    print(f"   Keyspace  : {ASTRA_KEYSPACE}")
    print(f"   Collection: {COLLECTION}\n")

# ── Connect to Astra DB ────────────────────────────
def get_collection():
    from astrapy import DataAPIClient
    client = DataAPIClient(ASTRA_TOKEN)
    db = client.get_database(ASTRA_ENDPOINT, keyspace=ASTRA_KEYSPACE)
    print("✅  Connected to Astra DB!")

    # Create collection if it doesn't exist (non-vector, plain document store)
    existing = db.list_collection_names()
    if COLLECTION not in existing:
        print(f"🆕  Creating collection '{COLLECTION}'...")
        db.create_collection(COLLECTION)
        print(f"✅  Collection '{COLLECTION}' created.")
    else:
        print(f"📂  Collection '{COLLECTION}' already exists.")

    return db.get_collection(COLLECTION)

# ── Fetch book list from GitHub ────────────────────
def fetch_book_list():
    url = f"{GITHUB_BASE}/Books.json"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    return resp.json()   # e.g. ["Genesis","Exodus",...]

# ── Fetch a single book JSON ───────────────────────
def fetch_book_data(book_name: str):
    # GitHub filenames: spaces removed, e.g. "1Samuel.json"
    filename = book_name.replace(" ", "")
    url = f"{GITHUB_BASE}/{filename}.json"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    return resp.json()

# ── Parse book JSON → list of verse dicts ─────────
def parse_verses(book_name: str, data: dict) -> list:
    # Canonical name from metadata (may differ slightly)
    canonical = data.get("metadata", {}).get("name", book_name)
    # Try to resolve book_id from canonical name or original name
    book_id = BOOK_ID_MAP.get(canonical) or BOOK_ID_MAP.get(book_name) or 0

    verses = []
    for chapter_data in data.get("chapters", []):
        chapter_num = int(chapter_data.get("chapter", 0))
        for verse_data in chapter_data.get("verses", []):
            verse_num = int(verse_data.get("verse", 0))
            text      = verse_data.get("text", "").strip()
            verses.append({
                "book":    canonical,
                "book_id": book_id,
                "chapter": chapter_num,
                "verse":   verse_num,
                "text":    text,
            })
    return verses

# ── Insert a batch of documents into Astra ─────────
def insert_batch(collection, batch: list):
    if not batch:
        return
    collection.insert_many(batch)

# ── Main Import Logic ──────────────────────────────
def import_bible():
    validate_credentials()

    print("🚀  Starting KJV Bible import → Astra DB\n")

    # Connect
    collection = get_collection()

    # Option: clear existing data for a fresh import
    answer = input("\n⚠️  Delete existing verses in 'bible_kjv' before import? (yes/no): ").strip().lower()
    if answer == "yes":
        print("🗑️   Deleting existing documents...")
        collection.delete_many({})
        print("✅  Collection cleared.\n")
    else:
        print("ℹ️   Keeping existing data (will append / may duplicate).\n")

    # Fetch book list
    print("📚  Fetching book list from GitHub...")
    try:
        books_list = fetch_book_list()
        print(f"📖  {len(books_list)} books found.\n")
    except Exception as e:
        print(f"❌  Failed to fetch book list: {e}")
        sys.exit(1)

    total_inserted  = 0
    failed_books    = []
    BATCH_SIZE      = 100   # Astra Data API handles up to 100 docs/insert_many

    for book_name in books_list:
        try:
            print(f"📥  Fetching '{book_name}'...", end=" ", flush=True)
            data   = fetch_book_data(book_name)
            verses = parse_verses(book_name, data)

            # Batch insert
            for i in range(0, len(verses), BATCH_SIZE):
                batch = verses[i : i + BATCH_SIZE]
                insert_batch(collection, batch)

            total_inserted += len(verses)
            print(f"✅  {len(verses)} verses inserted.")
            time.sleep(0.15)   # polite delay

        except Exception as e:
            print(f"\n❌  Error importing '{book_name}': {e}")
            failed_books.append(book_name)

    # ── Summary ────────────────────────────────────
    print("\n" + "="*50)
    print(f"🎉  Import complete!")
    print(f"    ✅  Total verses inserted : {total_inserted}")
    print(f"    📚  Books processed       : {len(books_list) - len(failed_books)}/{len(books_list)}")
    if failed_books:
        print(f"    ❌  Failed books          : {', '.join(failed_books)}")
    print(f"    🗄️   Collection             : {ASTRA_ENDPOINT} → {COLLECTION}")
    print("="*50)

if __name__ == "__main__":
    import_bible()
