import os
import json
import time
import concurrent.futures
from dotenv import load_dotenv
from azure.cosmos import CosmosClient, PartitionKey
from openai import OpenAI
from azure.cosmos.exceptions import CosmosHttpResponseError

# 1. Load Credentials
load_dotenv(".env.local")
COSMOS_CONNECTION_STRING = os.getenv("COSMOS_CONNECTION_STRING")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")

# 2. Setup Clients
openai_client = OpenAI(api_key=OPENAI_KEY)
cosmos_client = CosmosClient.from_connection_string(COSMOS_CONNECTION_STRING)

# 3. Target Configuration
DB_NAME = "BibleDatabase"
CONTAINER_NAME = "verses"
DIMENSIONS = 256  
MAX_UPLOAD_WORKERS = 10  # Can be increased to 20+ for faster uploads

# Global state for OpenAI quota
openai_available = True

def setup_cosmos():
    db = cosmos_client.get_database_client(DB_NAME)
    container = db.get_container_client(CONTAINER_NAME)
    return container

def get_optimized_embedding(text):
    global openai_available
    if not openai_available or not OPENAI_KEY:
        return None
    try:
        response = openai_client.embeddings.create(
            model="text-embedding-3-small", 
            input=text, 
            dimensions=DIMENSIONS
        )
        return response.data[0].embedding
    except Exception as e:
        if "quota" in str(e).lower() or "429" in str(e):
            print("🛑 OpenAI Quota reached (Upload). Skipping remaining vectors.")
            openai_available = False
        return None

def upload_verse(verse_data, container):
    """Processes and uploads a single verse JSON object"""
    try:
        # 1. Get embedding (requested "embedding things")
        # Optimization: Only embed if text is short enough and quota is available
        vector = get_optimized_embedding(verse_data.get("text", ""))
        
        # 2. Format for Cosmos
        # Ensure ID is unique and fields are clean
        doc = {
            "id": f"{verse_data.get('book')}_{verse_data.get('chapter')}_{verse_data.get('verse')}_{verse_data.get('version')}",
            "book": verse_data.get("book"),
            "chapter": int(verse_data.get("chapter", 0)),
            "verse": int(verse_data.get("verse", 0)),
            "text": verse_data.get("text"),
            "version": verse_data.get("version"),
            "vector": vector
        }
        
        # 3. Upsert to Cosmos with Retry
        retries = 3
        while retries > 0:
            try:
                container.upsert_item(doc)
                return True
            except CosmosHttpResponseError as e:
                if e.status_code == 429:
                    wait = int(e.headers.get("x-ms-retry-after-ms", 1000)) / 1000.0
                    time.sleep(wait)
                    retries -= 1
                else:
                    return False
        return False
    except Exception:
        return False

def upload_file(file_path, container):
    """Reads a JSON-L file and uploads items in parallel"""
    print(f"🚀 Starting upload: {os.path.basename(file_path)}")
    
    count = 0
    with open(file_path, 'r', encoding='utf-8') as f:
        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_UPLOAD_WORKERS) as executor:
            batch = []
            for line in f:
                verse = json.loads(line.strip())
                batch.append(verse)
                
                # Process in batches to manage memory
                if len(batch) >= 100:
                    futures = [executor.submit(upload_verse, v, container) for v in batch]
                    concurrent.futures.wait(futures)
                    count += len(batch)
                    batch = []
                    print(f"  ⬆️  {os.path.basename(file_path)}: {count} verses uploaded...")
            
            # Final small batch
            if batch:
                futures = [executor.submit(upload_verse, v, container) for v in batch]
                concurrent.futures.wait(futures)
                count += len(batch)

    print(f"✅ Finished file: {os.path.basename(file_path)} ({count} total)")

def main():
    container = setup_cosmos()
    
    # Find all export files in current directory
    files = [f for f in os.listdir('.') if f.endswith('_export.json')]
    
    # Priority: Smaller files first (quick wins)
    files.sort(key=lambda x: os.path.getsize(x))
    
    print(f"📂 Found {len(files)} files to upload to Azure Cosmos DB.")
    
    for file in files:
        upload_file(file, container)

if __name__ == "__main__":
    confirm = input("Start uploading JSON files to Azure? (y/n): ")
    if confirm.lower() == 'y':
        main()
