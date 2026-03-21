import os
from azure.cosmos import CosmosClient
from dotenv import load_dotenv

load_dotenv(".env.local")
client = CosmosClient.from_connection_string(os.getenv("COSMOS_CONNECTION_STRING"))
container = client.get_database_client("BibleDatabase").get_container_client("verses")

for v in ["CTUCTI", "KYG"]:
    query = f"SELECT DISTINCT VALUE c.book FROM c WHERE c.version = '{v}'"
    books = list(container.query_items(query=query, enable_cross_partition_query=True))
    print(f"Version {v} Books: {books}")
