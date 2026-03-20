import os
import csv
from dotenv import load_dotenv
from azure.cosmos import CosmosClient

load_dotenv(".env.local")
conn = os.getenv("COSMOS_CONNECTION_STRING")

def export_duplicates():
    print("Connecting to Cosmos DB to find duplicate verses...")
    try:
        client = CosmosClient.from_connection_string(conn)
        db = client.get_database_client("BibleDatabase")
        container = db.get_container_client("verses")
        
        # Query to find duplicates (where the random id doesn't match the standard verse_key)
        query = "SELECT c.id, c.verse_key, c.version, c.book, c.chapter, c.verse, c.text FROM c WHERE c.id != c.verse_key"
        
        print("Executing cross-partition query to find all duplicates...")
        print("This might take a minute...")
        
        # Enable cross partition query is required since we aren't filtering by 'version'
        items = list(container.query_items(query=query, enable_cross_partition_query=True))
        
        if not items:
            print("\n🎉 No duplicates found! Your database is completely clean.")
            return

        csv_file = "cosmos_duplicates_report.csv"
        print(f"\nFound {len(items)} duplicate records. Saving to {csv_file}...")
        
        with open(csv_file, mode="w", newline="", encoding="utf-8") as file:
            writer = csv.writer(file)
            # Write header
            writer.writerow(["ID (Random)", "Verse Key (Correct)", "Version", "Book", "Chapter", "Verse", "Text"])
            
            # Write data
            for item in items:
                writer.writerow([
                    item.get("id", ""),
                    item.get("verse_key", ""),
                    item.get("version", ""),
                    item.get("book", ""),
                    item.get("chapter", ""),
                    item.get("verse", ""),
                    item.get("text", "")
                ])
                
        print(f"\n✅ Successfully exported {len(items)} duplicates to: {csv_file}")
        print("You can now open this CSV file in Excel!")

    except Exception as e:
        print(f"Error fetching data: {e}")

if __name__ == "__main__":
    export_duplicates()
