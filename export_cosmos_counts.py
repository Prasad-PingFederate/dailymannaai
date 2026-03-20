import os
import csv
import json
import concurrent.futures
from dotenv import load_dotenv
from azure.cosmos import CosmosClient

load_dotenv(".env.local")
conn = os.getenv("COSMOS_CONNECTION_STRING")

# Read target versions
all_v = []
if os.path.exists("refined_eligible.json"):
    with open("refined_eligible.json", "r", encoding="utf-8") as f:
        all_v = [item["id"] for item in json.load(f) if item.get("id")]
else:
    print("No refined_eligible.json found. Please run the script in the project root.")
    exit(1)

def count_version(v_code, container):
    query = f"SELECT VALUE COUNT(1) FROM c WHERE c.version = '{v_code}'"
    try:
        count = list(container.query_items(query=query, partition_key=v_code))[0]
        return v_code, count
    except Exception as e:
        return v_code, 0

def export_counts():
    print(f"Connecting to Cosmos DB to fetch counts for {len(all_v)} versions...")
    try:
        client = CosmosClient.from_connection_string(conn)
        db = client.get_database_client("BibleDatabase")
        container = db.get_container_client("verses")
        
        results = []
        total_verses = 0
        
        print("Querying versions (this will take 10-20 seconds)...")
        # Run queries in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(count_version, v, container) for v in all_v]
            for idx, fut in enumerate(concurrent.futures.as_completed(futures), 1):
                v_code, count = fut.result()
                results.append((v_code, count))
                total_verses += count
                if idx % 100 == 0:
                    print(f"  Processed {idx}/{len(all_v)} versions...")

        csv_file = "cosmos_counts_report.csv"
        with open(csv_file, mode="w", newline="", encoding="utf-8") as file:
            writer = csv.writer(file)
            writer.writerow(["Version", "Verse Count"])
            
            # Sort alphabetically by version
            for v_code, count in sorted(results):
                writer.writerow([v_code, count])
                
            writer.writerow([])
            writer.writerow(["TOTAL", total_verses])
            
        print(f"\n✅ Successfully exported counts for {len(results)} versions to: {csv_file}")
        print("You can now open this CSV file in Excel.")

    except Exception as e:
        print(f"Error fetching data: {e}")

if __name__ == "__main__":
    export_counts()
