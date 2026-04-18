import os
import requests
import zipfile
import re
import json
from io import BytesIO
from azure.cosmos import CosmosClient
from dotenv import load_dotenv

load_dotenv(".env.local")
CONN_STR = os.getenv("COSMOS_CONNECTION_STRING")
client = CosmosClient.from_connection_string(CONN_STR)
container = client.get_database_client("BibleDatabase").get_container_client("verses")

USFM_BOOKS = {
    "GEN": "Genesis", "EXO": "Exodus", "LEV": "Leviticus", "NUM": "Numbers", "DEU": "Deuteronomy",
    "JOS": "Joshua", "JDG": "Judges", "RUT": "Ruth", "1SA": "1 Samuel", "2SA": "2 Samuel",
    "1KI": "1 Kings", "2KI": "2 Kings", "1CH": "1 Chronicles", "2CH": "2 Chronicles",
    "EZR": "Ezra", "NEH": "Nehemiah", "EST": "Esther", "JOB": "Job", "PSA": "Psalms",
    "PRO": "Proverbs", "ECC": "Ecclesiastes", "SNG": "Song of Solomon", "ISA": "Isaiah",
    "JER": "Jeremiah", "LAM": "Lamentations", "EZK": "Ezekiel", "DAN": "Daniel",
    "HOS": "Hosea", "JOL": "Joel", "AMO": "Amos", "OBA": "Obadiah", "JON": "Jonah",
    "MIC": "Micah", "NAM": "Nahum", "HAB": "Habakkuk", "ZEP": "Zephaniah", "HAG": "Haggai",
    "ZEC": "Zechariah", "MAL": "Malachi",
    "MAT": "Matthew", "MAR": "Mark", "LUK": "Luke", "JHN": "John", "ACT": "Acts",
    "ROM": "Romans", "1CO": "1 Corinthians", "2CO": "2 Corinthians", "GAL": "Galatians",
    "EPH": "Ephesians", "PHP": "Philippians", "COL": "Colossians", "1TH": "1 Thessalonians",
    "2TH": "2 Thessalonians", "1TI": "1 Timothy", "2TI": "2 Timothy", "TIT": "Titus",
    "PHM": "Philemon", "HEB": "Hebrews", "JAS": "James", "1PE": "1 Peter", "2PE": "2 Peter",
    "1JN": "1 John", "2JN": "2 John", "3JN": "3 John", "JUD": "Jude", "REV": "Revelation"
}

def parse_usfm_content(content, version_code):
    verses = []
    current_book = None
    current_chapter = 0
    
    lines = content.splitlines()
    for line in lines:
        line = line.strip()
        if not line: continue
        
        # Book ID
        if line.startswith("\\id "):
            book_id = line.split()[1].upper()
            current_book = USFM_BOOKS.get(book_id)
            if not current_book:
                # Try to find book name in \h or \toc
                continue
        
        # Chapter
        elif line.startswith("\\c "):
            try:
                current_chapter = int(line.split()[1])
            except:
                pass
                
        # Verse
        elif line.startswith("\\v "):
            if not current_book or current_chapter == 0: continue
            
            # Extract verse number and text
            # Format: \v 1 In the beginning...
            match = re.match(r"\\v\s+(\d+(?:-\d+)?)\s+(.*)", line)
            if match:
                v_num_str = match.group(1)
                v_text = match.group(2)
                
                # Handle verse ranges like 1-2
                v_num = int(v_num_str.split('-')[0])
                
                # Basic USFM tag cleanup
                v_text = re.sub(r'\\(\w+)\s*.*?\s*\\\1\*', '', v_text) # Remove paired tags like \f ... \f*
                v_text = re.sub(r'\\\w+\*?', '', v_text) # Remove single tags
                v_text = v_text.strip()
                
                if v_text:
                    verses.append({
                        "id": f"{current_book}_{current_chapter}_{v_num}_{version_code}",
                        "version": version_code,
                        "book": current_book,
                        "chapter": current_chapter,
                        "verse": v_num,
                        "text": v_text
                    })
    return verses

def process_ebible_zip(url, version_code):
    print(f"Downloading {url} for {version_code}...")
    r = requests.get(url)
    if r.status_code != 200:
        print(f"Failed to download: {r.status_code}")
        return
    
    with zipfile.ZipFile(BytesIO(r.content)) as z:
        all_verses = []
        for filename in z.namelist():
            if filename.endswith(".usfm") or filename.endswith(".SFM"):
                with z.open(filename) as f:
                    content = f.read().decode("utf-8-sig", errors="ignore")
                    verses = parse_usfm_content(content, version_code)
                    all_verses.extend(verses)
        
        print(f"Extracted {len(all_verses)} verses for {version_code}.")
        
        # Save to JSON for uploader
        target_json = f"export/{version_code}.json"
        with open(target_json, "w", encoding="utf-8") as f:
            for v in all_verses:
                f.write(json.dumps(v) + "\n")
        print(f"Saved to {target_json}")

if __name__ == "__main__":
    if not os.path.exists("export"): os.makedirs("export")
    
    targets = [
        ("https://eBible.org/Scriptures/ctuBl_usfm.zip", "CTU77"),
        ("https://eBible.org/Scriptures/kyg_usfm.zip", "KYG")
    ]
    
    for url, code in targets:
        process_ebible_zip(url, code)
