import os
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")
token = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")
client = DataAPIClient(token)
db = client.get_database(endpoint)

colls = db.list_collection_names()
print(f"Collections: {colls}")
