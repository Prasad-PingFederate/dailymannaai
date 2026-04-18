import os
from azure.cosmos import CosmosClient
from dotenv import load_dotenv

load_dotenv(".env.local")
client = CosmosClient.from_connection_string(os.getenv("COSMOS_CONNECTION_STRING"))
container = client.get_database_client("BibleDatabase").get_container_client("verses")

versions = ["CTUCTI", "KYG", "ctucti", "kyg"]
for v in versions:
    query = f"SELECT VALUE COUNT(1) FROM c WHERE c.version = '{v}'"
    count = list(container.query_items(query=query, enable_cross_partition_query=True))[0]
    print(f"Version {v}: {count} records")
