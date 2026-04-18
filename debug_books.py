"""Debug: check what book names exist in AstraDB for numbered books like 1 Peter, 2 Peter, etc."""
import os, json
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv()
client = DataAPIClient(os.getenv("ASTRA_DB_APPLICATION_TOKEN"))
db = client.get_database_by_api_endpoint(os.getenv("ASTRA_DB_API_ENDPOINT"))
col = db.get_collection("bible_ar")

# Test with a known NT-only translation (e.g., cleNT = Chinantec, Lealao)
test_version = "CLENT"

# First, let's see what NT books exist for this version
print(f"=== Checking books for version {test_version} ===")

# Get distinct book names for this version
all_docs = col.find({"version": test_version}, limit=20)
books_found = set()
for doc in all_docs:
    books_found.add(doc.get("book", "???"))
print(f"Sample books found: {sorted(books_found)}")

# Now check specifically for numbered books
problem_books = ["1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude",
                 "1 peter", "2 peter", "1 john", "2 john", "3 john", "jude",
                 "1Peter", "2Peter", "1John", "2John", "3John",
                 "I Peter", "II Peter", "I John", "II John", "III John"]

for b in problem_books:
    result = list(col.find({"version": test_version, "book": b, "chapter": 1}, limit=3))
    if result:
        print(f"  FOUND '{b}': {len(result)} verses (sample: verse {result[0].get('verse')})")

# Also try with a wildcard / get all unique books for this version
print("\n=== ALL book names in this version ===")
all_books = col.find({"version": test_version}, limit=1000)
unique_books = {}
for doc in all_books:
    bn = doc.get("book", "???")
    if bn not in unique_books:
        unique_books[bn] = 0
    unique_books[bn] += 1

for bn in sorted(unique_books.keys()):
    print(f"  {bn}: {unique_books[bn]} verses")
