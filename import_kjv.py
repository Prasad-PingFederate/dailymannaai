import requests
import json
import time
from pymongo import MongoClient

# 1. MongoDB Configuration
MONGO_URI = "mongodb+srv://dailymanna_admin:Nrp16qWa0bcc8iLW@dailymannaai.uwsuqk6.mongodb.net/?appName=DailyMannaAI" 
DB_NAME = "DailyMannaAI"
COLLECTION_NAME = "bible_kjv"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

# 2. List of all 66 books (Correctly named for GitHub URLs)
books = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
    "1-Samuel", "2-Samuel", "1-Kings", "2-Kings", "1-Chronicles", "2-Chronicles", "Ezra", "Nehemiah", 
    "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song-of-Solomon", "Isaiah", "Jeremiah", 
    "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", 
    "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", 
    "John", "Acts", "Romans", "1-Corinthians", "2-Corinthians", "Galatians", "Ephesians", 
    "Philippians", "Colossians", "1-Thessalonians", "2-Thessalonians", "1-Timothy", "2-Timothy", 
    "Titus", "Philemon", "Hebrews", "James", "1-Peter", "2-Peter", "1-John", "2-John", "3-John", 
    "Jude", "Revelation"
]

def import_bible():
    print(f"🚀 Starting Bible Import into MongoDB: {DB_NAME}.{COLLECTION_NAME}")
    
    # 0. Fetch Book List dynamically
    try:
        books_url = "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/Books.json"
        books_resp = requests.get(books_url)
        books_resp.raise_for_status()
        books_list = books_resp.json()
        print(f"📚 Found {len(books_list)} books to import.")
    except Exception as e:
        print(f"❌ Could not fetch book list: {e}")
        return

    # Clear existing data if you want a fresh start
    try:
        collection.delete_many({}) 
    except Exception as e:
        print(f"⚠️ Could not connect to MongoDB. Is it running? Error: {e}")
        return
    
    total_inserted = 0
    
    for book in books_list:
        # Files on GitHub don't have spaces (e.g. "1Samuel.json")
        encoded_book = book.replace(" ", "")
        url = f"https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/{encoded_book}.json"
        
        try:
            print(f"📥 Fetching {book}...")
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            
            book_name = data.get('metadata', {}).get('name', book)
            verses_to_insert = []
            
            for chapter_data in data.get('chapters', []):
                chapter_num = int(chapter_data.get('chapter', 0))
                for verse_data in chapter_data.get('verses', []):
                    verse_num = int(verse_data.get('verse', 0))
                    text = verse_data.get('text', "")
                    
                    verses_to_insert.append({
                        "book": book_name,
                        "chapter": chapter_num,
                        "verse": verse_num,
                        "text": text
                    })
            
            if verses_to_insert:
                collection.insert_many(verses_to_insert)
                total_inserted += len(verses_to_insert)
                print(f"✅ Inserted {len(verses_to_insert)} verses from {book}.")
            
            time.sleep(0.1) # Fast enough but respectful
            
        except Exception as e:
            print(f"❌ Error importing {book}: {e}")

    print("\n" + "="*30)
    print(f"🎉 SUCCESS! Imported {total_inserted} total verses.")
    print("="*30)

if __name__ == "__main__":
    import_bible()