import os
import xml.etree.ElementTree as ET
import json

if not os.path.exists("export"):
    os.makedirs("export")

BOOK_MAP = {
    "GEN": "Genesis", "EXO": "Exodus", "LEV": "Leviticus", "NUM": "Numbers", "DEU": "Deuteronomy",
    "JOS": "Joshua", "JDG": "Judges", "RUT": "Ruth", "1SA": "1 Samuel", "2SA": "2 Samuel",
    "1KI": "1 Kings", "2KI": "2 Kings", "1CH": "1 Chronicles", "2CH": "2 Chronicles",
    "EZR": "Ezra", "NEH": "Nehemiah", "EST": "Esther", "JOB": "Job", "PSA": "Psalms",
    "PRO": "Proverbs", "ECC": "Ecclesiastes", "SNG": "Song of Solomon", "ISA": "Isaiah",
    "JER": "Jeremiah", "LAM": "Lamentations", "EZK": "Ezekiel", "DAN": "Daniel",
    "HOS": "Hosea", "JOL": "Joel", "AMO": "Amos", "OBA": "Obadiah", "JON": "Jonah",
    "MIC": "Micah", "NAM": "Nahum", "HAB": "Habakkuk", "ZEP": "Zephaniah", "HAG": "Haggar",
    "ZEC": "Zechariah", "MAL": "Malachi",
    "MAT": "Matthew", "MAR": "Mark", "LUK": "Luke", "JHN": "John", "ACT": "Acts",
    "ROM": "Romans", "1CO": "1 Corinthians", "2CO": "2 Corinthians", "GAL": "Galatians",
    "EPH": "Ephesians", "PHP": "Philippians", "COL": "Colossians", "1TH": "1 Thessalonians",
    "2TH": "2 Thessalonians", "1TI": "1 Timothy", "2TI": "2 Timothy", "TIT": "Titus",
    "PHM": "Philemon", "HEB": "Hebrews", "JAS": "James", "1PE": "1 Peter", "2PE": "2 Peter",
    "1JN": "1 John", "2JN": "2 John", "3JN": "3 John", "JUD": "Jude", "REV": "Revelation"
}

def convert_xml(file_path, version_code):
    print(f"Parsing {file_path} for version {version_code}...")
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
    except Exception as e:
        print(f"FAILED TO PARSE {file_path}: {e}")
        return
    
    verses = []
    # Structure: body -> div (book) -> div (chapter) -> seg (verse)
    for book_div in root.findall(".//div[@type='book']"):
        book_id_raw = book_div.get("id", "").split(".")[-1]
        book_name = BOOK_MAP.get(book_id_raw, book_id_raw)
        
        for chap_div in book_div.findall(".//div[@type='chapter']"):
            chap_num_raw = chap_div.get("id", "").split(".")[-1]
            try:
                chapter = int(chap_num_raw)
            except:
                continue
                
            for v_seg in chap_div.findall(".//seg[@type='verse']"):
                v_id_raw = v_seg.get("id", "").split(".")[-1]
                try:
                    verse = int(v_id_raw)
                except:
                    continue
                
                text = (v_seg.text or "").strip()
                if not text: continue
                
                doc = {
                    "id": f"{book_name}_{chapter}_{verse}_{version_code}",
                    "version": version_code,
                    "book": book_name,
                    "chapter": chapter,
                    "verse": verse,
                    "text": text
                }
                verses.append(doc)
    
    if not verses:
        print(f"No verses found in {file_path}")
        return

    print(f"Extracted {len(verses)} verses. Saving to JSON...")
    
    target_json = f"export/{version_code}.json"
    with open(target_json, "w", encoding="utf-8") as f:
        for v in verses:
            f.write(json.dumps(v) + "\n")
    print(f"SUCCESS: {target_json} created.")

if __name__ == "__main__":
    xmls = {
        "Paite.xml": "PCK",
        "Arabic.xml": "ARB-XML",
        "Burmese.xml": "MYA-XML",
        "Farsi.xml": "PES-XML",
        "Tagalog.xml": "TGL-XML",
        "Turkish.xml": "TUR-XML"
    }
    
    for fname, vcode in xmls.items():
        path = f"Bible-Corpus-XML/{fname}"
        if os.path.exists(path):
            convert_xml(path, vcode)
        else:
            print(f"Skipping {fname} - not found.")
