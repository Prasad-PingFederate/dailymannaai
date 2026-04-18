import os, json
from azure.cosmos import CosmosClient
from dotenv import load_dotenv

load_dotenv(".env.local")
client = CosmosClient.from_connection_string(os.getenv("COSMOS_CONNECTION_STRING"))
db = client.get_database_client("BibleDatabase")
container = db.get_container_client("verses")

query = "SELECT DISTINCT c.version FROM c"
items = container.query_items(query=query, enable_cross_partition_query=True)
versions = [item.get("version") for item in items]

ret = {}
ret['ru'] = [v for v in versions if v and 'RU' in v.upper()]
ret['fi'] = [v for v in versions if v and 'FI' in v.upper()]

with open('translations.json', 'w') as f:
    json.dump(ret, f, indent=2)
