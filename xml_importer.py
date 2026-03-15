import os
import xml.etree.ElementTree as ET
from dotenv import load_dotenv
from astrapy import DataAPIClient
import time

# Use absolute path for .env.local
script_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(script_dir, ".env.local"))

ASTRA_TOKEN   = os.getenv("ASTRA_DB_TOKEN") or os.getenv("ASTRA_DB_APPLICATION_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")
TARGET_COLLECTION = "bible_ar"

BASE_DIR = r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\Bible-Corpus-XML"
XML_FILES = [
    {"file": "Paite.xml", "lang": "Paite", "code": "PCK"},
    {"file": "Arabic.xml", "lang": "Arabic", "code": "ARB-XML"},
    {"file": "Burmese.xml", "lang": "Burmese", "code": "MY-XML"},
    {"file": "Farsi.xml", "lang": "Farsi", "code": "PES-XML"},
    {"file": "Tagalog.xml", "lang": "Tagalog", "code": "TL-XML"},
    {"file": "Turkish.xml", "lang": "Turkish", "code": "TR-XML"}
]

BOOK_MAP = {
    "GEN": "Genesis", "EXO": "Exodus", "LEV": "Leviticus", "NUM": "Numbers", "DEU": "Deuteronomy",
    "JOS": "Joshua", "JDG": "Judges", "RUT": "Ruth", "1SA": "1 Samuel", "2SA": "2 Samuel",
    "1KI": "1 Kings", "2KI": "2 Kings", "1CH": "1 Chronicles", "2CH": "2 Chronicles",
    "EZR": "Ezra", "NEH": "Nehemiah", "EST": "Esther", "JOB": "Job", "PSA": "Psalms",
    "PRO": "Proverbs", "ECC": "Ecclesiastes", "SNG": "Song of Solomon", "ISA": "Isaiah",
    "JER": "Jeremiah", "LAM": "Lamentations", "EZK": "Ezekiel", "DAN": "Daniel",
    "HOS": "Hosea", "JOL": "Joel", "AMO": "Amos", "OBA": "Obadiah", "JON": "Jonah",
    "MIC": "Micah", "NAM": "Nahum", "HAB": "Habakkuk", "ZEP": "Zephaniah", "HAG": "Hagga",
    "ZEC": "Zechariah", "MAL": "Malachi", "MAT": "Matthew", "MRK": "Mark", "LUK": "Luke",
    "JHN": "John", "ACT": "Acts", "ROM": "Romans", "1CO": "1 Corinthians", "2CO": "2 Corinthians",
    "GAL": "Galatians", "EPH": "Ephesians", "PHP": "Philippians", "COL": "Colossians",
    "1TH": "1 Thessalonians", "2TH": "2 Thessalonians", "1TI": "1 Timothy", "2TI": "2 Timothy",
    "TIT": "Titus", "PHM": "Philemon", "HEB": "Hebrews", "JAS": "James", "1PE": "1 Peter",
    "2PE": "2 Peter", "1JN": "1 John", "2JN": "2 John", "3JN": "3 John", "JUD": "Jude",
    "REV": "Revelation"
}

def parse_ces_xml(file_path, version_code):
    print(f"Parsing {file_path}...")
    tree = ET.parse(file_path)
    root = tree.getroot()
    verses = []
    
    # Structure: cesDoc -> text -> body -> div (book) -> div (chapter) -> seg (verse)
    # Book div id starts with b.
    for book_div in root.findall(".//div[@type='book']"):
        book_id_attr = book_div.get('id', '')
        # b.GEN
        book_code = book_id_attr.split('.')[-1]
        book_name = BOOK_MAP.get(book_code)
        if not book_name: continue
        
        for chapter_div in book_div.findall(".//div[@type='chapter']"):
            chapter_id_attr = chapter_div.get('id', '')
            # b.GEN.1
            try:
                chapter_num = int(chapter_id_attr.split('.')[-1])
            except: continue
            
            for verse_seg in chapter_div.findall(".//seg[@type='verse']"):
                verse_id_attr = verse_seg.get('id', '')
                # b.GEN.1.1
                try:
                    verse_num = int(verse_id_attr.split('.')[-1])
                except: continue
                
                text = (verse_seg.text or "").strip()
                if not text: continue
                
                verses.append({
                    "book": book_name,
                    "chapter": chapter_num,
                    "verse": verse_num,
                    "text": text,
                    "version": version_code.upper()
                })
    return verses

def main():
    client = DataAPIClient(ASTRA_TOKEN)
    db = client.get_database(ASTRA_ENDPOINT)
    collection = db.get_collection(TARGET_COLLECTION)

    for entry in XML_FILES:
        fpath = os.path.join(BASE_DIR, entry['file'])
        vcode = entry['code']
        
        print(f"\nProcessing local XML: {entry['lang']} ({vcode})")
        
        # Check if exists
        try:
            if list(collection.find({"version": vcode.upper()}, limit=1)):
                print(f"Skipping {vcode} - already in DB")
                continue
        except Exception: pass

        if not os.path.exists(fpath):
            print(f"File not found: {fpath}")
            continue

        try:
            verses = parse_ces_xml(fpath, vcode)
            if not verses:
                print("No verses found.")
                continue
            
            print(f"Found {len(verses)} verses. Importing...")
            batch_size = 200 # Increased batch size
            for i in range(0, len(verses), batch_size):
                batch = verses[i:i+batch_size]
                collection.insert_many(batch)
            print(f"Successfully imported {entry['lang']}")
        except Exception as e:
            print(f"Error processing {entry['file']}: {e}")

if __name__ == "__main__":
    main()
