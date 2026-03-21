import os
from azure.cosmos import CosmosClient
from dotenv import load_dotenv

load_dotenv('.env.local')
client = CosmosClient.from_connection_string(os.getenv('COSMOS_CONNECTION_STRING'))
container = client.get_database_client('BibleDatabase').get_container_client('verses')

q = "SELECT DISTINCT c.version FROM c WHERE CONTAINS(c.version, 'FIN', true) OR CONTAINS(c.version, 'SUO', true) OR CONTAINS(c.version, 'PRAM', true) OR CONTAINS(c.version, 'PYH', true)"
for item in container.query_items(query=q, enable_cross_partition_query=True):
    v = item.get('version')
    print(v)
