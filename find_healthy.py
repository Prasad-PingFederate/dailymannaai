import os
from dotenv import load_dotenv
from astrapy import DataAPIClient

load_dotenv(".env.local")
client = DataAPIClient(os.getenv("ASTRA_DB_APPLICATION_TOKEN"))
db = client.get_database(os.getenv("ASTRA_DB_API_ENDPOINT"))

candidates = sorted(db.list_collection_names())
healthy = []
for name in candidates:
    try:
        db.get_collection(name).find({"book": "X"}, limit=1)
        healthy.append(name)
    except:
        pass

print("HEALTHY_COLLECTIONS:" + ",".join(healthy))
