import os
import time
import concurrent.futures
from dotenv import load_dotenv
from astrapy import DataAPIClient
from azure.cosmos import CosmosClient, PartitionKey
from openai import OpenAI
from azure.cosmos.exceptions import CosmosResourceExistsError, CosmosHttpResponseError

# 1. Load Credentials
load_dotenv(".env.local")

ASTRA_TOKEN = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")
COSMOS_CONNECTION_STRING = os.getenv("COSMOS_CONNECTION_STRING")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")

# 2. Setup Clients
openai_client = OpenAI(api_key=OPENAI_KEY)
astra_client = DataAPIClient(ASTRA_TOKEN)
astra_db = astra_client.get_database(ASTRA_ENDPOINT)
cosmos_client = CosmosClient.from_connection_string(COSMOS_CONNECTION_STRING)

# 3. Target Configuration
DB_NAME = "BibleDatabase"
CONTAINER_NAME = "verses"
DIMENSIONS = 256  
MAX_WORKERS = 5 # As requested by user

def setup_cosmos():
    print(f"🛠️ Setting up Cosmos DB: {DB_NAME}...")
    db = cosmos_client.create_database_if_not_exists(id=DB_NAME)
    
    vector_embedding_policy = {
        "vectorEmbeddings": [{"path": "/vector", "dataType": "float32", "distanceFunction": "cosine", "dimensions": DIMENSIONS}]
    }
    indexing_policy = {
        "vectorIndexes": [{"path": "/vector", "type": "diskann"}]
    }

    try:
        container = db.create_container_if_not_exists(
            id=CONTAINER_NAME,
            partition_key=PartitionKey(path="/version"),
            vector_embedding_policy=vector_embedding_policy,
            indexing_policy=indexing_policy
        )
        return container
    except Exception as e:
        return db.create_container_if_not_exists(id=CONTAINER_NAME, partition_key=PartitionKey(path="/version"))

# State to track OpenAI availability
openai_available = True

def get_optimized_embedding(text):
    global openai_available
    if not openai_available: return None
    try:
        response = openai_client.embeddings.create(model="text-embedding-3-small", input=text, dimensions=DIMENSIONS)
        return response.data[0].embedding
    except Exception as e:
        if "quota" in str(e).lower() or "429" in str(e):
            print("🛑 OpenAI Quota exceeded. Switching to TEXT-ONLY.")
            openai_available = False
        return None

def process_doc(doc, coll_name, container):
    """Worker function to process a single document"""
    verse_text = doc.get("text", "")
    if not verse_text: return False

    new_vector = get_optimized_embedding(verse_text)
    
    cosmos_doc = {
        "id": f"{doc.get('book', 'Unknown')}_{doc.get('chapter', 0)}_{doc.get('verse', 0)}_{doc.get('version', 'BASE')}",
        "book": doc.get("book"),
        "chapter": doc.get("chapter"),
        "verse": doc.get("verse"),
        "text": verse_text,
        "version": doc.get("version", coll_name.split('_')[-1].upper()),
        "vector": new_vector 
    }

    # Retry logic for Cosmos DB Throttling (429)
    retries = 3
    while retries > 0:
        try:
            container.upsert_item(cosmos_doc)
            return True
        except CosmosHttpResponseError as e:
            if e.status_code == 429:
                wait_time = int(e.headers.get("x-ms-retry-after-ms", 1000)) / 1000.0
                time.sleep(wait_time)
                retries -= 1
            else:
                print(f"  ❌ Cosmos Error: {e.message}")
                break
        except Exception as e:
            print(f"  ❌ System Error: {e}")
            break
    return False

def migrate():
    container = setup_cosmos()
    colls = astra_db.list_collection_names()
    bible_colls = sorted([c for c in colls if c.startswith("bible_")])
    
    print(f"🚀 Found {len(bible_colls)} Bible collections. Using {MAX_WORKERS} parallel jobs.")

    for coll_name in bible_colls:
        print(f"\n📖 Processing: {coll_name}...")
        astra_coll = astra_db.get_collection(coll_name)
        count = 0
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            future_to_doc = {}
            
            for doc in astra_coll.find({}):
                future = executor.submit(process_doc, doc, coll_name, container)
                future_to_doc[future] = doc
                
                # Maintain a buffer to avoid memory overflow
                if len(future_to_doc) >= MAX_WORKERS * 20: 
                    finished, _ = concurrent.futures.wait(list(future_to_doc.keys()), return_when=concurrent.futures.FIRST_COMPLETED)
                    for f in finished:
                        if f.result(): 
                            count += 1
                        del future_to_doc[f]
                    
                    if count % 500 == 0 and count > 0:
                        status = "with vector" if openai_available else "TEXT ONLY"
                        print(f"  ✅ {coll_name}: {count} verses migrated [{status}]")

            # Final cleanup
            for f in concurrent.futures.as_completed(future_to_doc):
                if f.result(): 
                    count += 1

        print(f"🎉 Completed {coll_name}: {count} total verses migrated.")

if __name__ == "__main__":
    migrate()
