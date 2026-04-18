"""Quick diagnostic: test a single Cosmos DB write and capture the exact error."""
import os, uuid, traceback, time
from dotenv import load_dotenv
from azure.cosmos import CosmosClient

load_dotenv(".env.local")
conn = os.getenv("COSMOS_CONNECTION_STRING")
print(f"Connection string starts with: {conn[:60]}...")

try:
    client    = CosmosClient.from_connection_string(conn, connection_timeout=30, request_timeout=60)
    db        = client.get_database_client("BibleDatabase")
    container = db.get_container_client("verses")

    # Read test
    print("Testing READ...")
    props = container.read()
    print(f"  ✅ Container exists: {props['id']}")
    print(f"  Partition key: {props.get('partitionKey')}")

    # Write test — single doc
    print("\nTesting WRITE (single doc)...")
    test_doc = {
        "id":        "test_" + str(uuid.uuid4()),
        "verse_key": "TEST_1_1_TEST",
        "book":      "TEST",
        "chapter":   1,
        "verse":     1,
        "text":      "This is a test verse.",
        "version":   "TEST"
    }
    t0 = time.time()
    result = container.upsert_item(test_doc)
    elapsed = time.time() - t0
    print(f"  ✅ Write succeeded in {elapsed:.2f}s: id={result['id']}")

except Exception as e:
    print(f"\n❌ ERROR: {type(e).__name__}: {e}")
    traceback.print_exc()
    import sys; sys.exit(1)

