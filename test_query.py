import os
import requests
import json
import hmac
import hashlib
import base64
import urllib.parse
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv(".env.local")
CONN_STR = os.getenv("COSMOS_CONNECTION_STRING")

def parse_conn_str(conn_str):
    parts = {}
    for pair in conn_str.split(';'):
        if '=' in pair:
            key, val = pair.split('=', 1)
            parts[key] = val
    return parts['AccountEndpoint'], parts['AccountKey']

ENDPOINT, MASTER_KEY = parse_conn_str(CONN_STR)
DB_NAME = "BibleDatabase"
CONTAINER_NAME = "verses"

def get_auth_header(verb, resource_type, resource_id, date):
    key = base64.b64decode(MASTER_KEY)
    text = f"{verb.lower()}\n{resource_type.lower()}\n{resource_id}\n{date.lower()}\n\n"
    hmac_obj = hmac.new(key, text.encode('utf-8'), hashlib.sha256)
    signature = base64.b64encode(hmac_obj.digest()).decode('utf-8')
    auth_str = urllib.parse.quote(f"type=master&ver=1.0&sig={signature}")
    return auth_str

def test_query():
    resource_link = f"dbs/{DB_NAME}/colls/{CONTAINER_NAME}"
    url = f"{ENDPOINT}{resource_link}/docs"
    date = datetime.now(timezone.utc).strftime('%a, %d %b %Y %H:%M:%S GMT')
    auth = get_auth_header("POST", "docs", resource_link, date)
    
    headers = {
        "Authorization": auth,
        "x-ms-date": date,
        "x-ms-version": "2018-12-31",
        "Content-Type": "application/query+json",
        "x-ms-documentdb-isquery": "True",
        "x-ms-documentdb-query-enablecrosspartition": "True",
        "x-ms-max-item-count": "100"
    }
    
    query = {"query": "SELECT TOP 10 c.id FROM c"}
    
    resp = requests.post(url, json=query, headers=headers)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"Docs: {len(data.get('Documents', []))}")
        print(f"Item: {data.get('Documents', [None])[0]}")
    else:
        print(f"Error: {resp.text}")

if __name__ == "__main__":
    test_query()
