import os
from azure.cosmos import CosmosClient
from dotenv import load_dotenv

load_dotenv('.env.local')
client = CosmosClient.from_connection_string(os.getenv('COSMOS_CONNECTION_STRING'))
container = client.get_database_client('BibleDatabase').get_container_client('verses')

for v in ['RUSSYN', 'RU', 'FIN', 'FI']:
    q = f"SELECT VALUE COUNT(1) FROM c WHERE c.version = '{v}'"
    c = list(container.query_items(query=q, enable_cross_partition_query=True))[0]
    print(f"{v}: {c} verses")
