import os
import json
import logging
import asyncio
from typing import List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from celery.result import AsyncResult
from dotenv import load_dotenv

from astrapy import DataAPIClient

# Try loading from possible locations
load_dotenv(".env")
load_dotenv(".env.local")
load_dotenv("backend/.env")

# Existing imports
try:
    from src.tasks import crawl_query_task
except ImportError:
    from .tasks import crawl_query_task

from src.models.models import SessionLocal, Content

app = FastAPI(title="DailyMannaAI — Spiritual Wisdom API & On-Demand Crawler")

# Add CORS Middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = logging.getLogger(__name__)

# ─── ASTRA DB INITIALIZATION ─────────────────────────────────

ASTRA_TOKEN = os.getenv("ASTRA_DB_TOKEN")
# Support both possible variable names for the endpoint
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT") or os.getenv("ASTRA_DB_ENDPOINT")
ASTRA_KEYSPACE = os.getenv("ASTRA_DB_KEYSPACE", "default_keyspace")

def get_astra_db():
    if not ASTRA_TOKEN or not ASTRA_ENDPOINT:
        logger.warning("⚠️ [AstraDB] Missing ASTRA_DB_TOKEN or ASTRA_DB_API_ENDPOINT.")
        return None
    
    try:
        client = DataAPIClient(ASTRA_TOKEN)
        # Using the standard get_database method which is more robust
        db = client.get_database(ASTRA_ENDPOINT, keyspace=ASTRA_KEYSPACE)
        return db
    except Exception as e:
        logger.error(f"❌ [AstraDB] Connection failed: {e}")
        return None

astra_db = get_astra_db()

def get_col():
    if not astra_db:
        return None
    return astra_db.get_collection("sermons_archive")

def map_sermon(s: dict) -> dict:
    """
    FIX 3: Map ALL fields from DB shape → Frontend shape
    Your DB uses:  preacher, title, audioUrl
    Frontend uses: speaker,  sermon_title, audio_url
    """
    return {
        "_id":                str(s.get("_id", "")),
        "speaker":            s.get("preacher") or s.get("speaker") or "Unknown Preacher",
        "sermon_title":       s.get("title")    or s.get("sermon_title") or "Untitled Message",
        "content":            s.get("content", ""),
        "audio_url":          s.get("audio_url") or s.get("audioUrl", ""),
        "scripture_reference":s.get("scripture_reference", s.get("scripture", s.get("reference", ""))),
        "duration":           s.get("duration", ""),
        "date":               s.get("date", ""),
        "series":             s.get("series") or s.get("category", ""),
    }

# ─── EXISTING CRAWLER ROUTES ─────────────────────────────────

@app.get("/search")
async def search(q: str = Query(..., description="Search query")):
    task = crawl_query_task.delay(q)
    return JSONResponse({"task_id": task.id, "query": q})

@app.get("/result/{task_id}")
async def get_result(task_id: str):
    task = AsyncResult(task_id, app=crawl_query_task.app)
    if task.state == 'PENDING':
        return JSONResponse({"state": "PENDING"})
    elif task.state == 'FAILURE':
        return JSONResponse({"state": "FAILURE", "error": str(task.info)})
    elif task.state == 'SUCCESS':
        content_ids = task.result
        db = SessionLocal()
        contents = db.query(Content).filter(Content.id.in_(content_ids)).all()
        db.close()
        return JSONResponse({
            "state": "SUCCESS",
            "results": [content.to_dict() for content in contents]
        })
    else:
        return JSONResponse({"state": task.state, "info": task.info})

# ─── 📜 MAPPED SERMONS ROUTES (ASTRA DB - 80GB ARCHIVE) ───────────────────────────

@app.get("/sermons/speakers")
async def get_speakers():
    """Returns unique speaker list with sermon counts for filter tags"""
    col = get_col()
    if not col:
        return JSONResponse({"speakers": []})
    
    try:
        # Fetch only name fields — fast and lightweight
        cursor = col.find({}, projection={"preacher": True, "speaker": True, "_id": False}, limit=2000)
        docs = list(cursor)

        counts = {}
        for doc in docs:
            name = (doc.get("preacher") or doc.get("speaker", "")).strip()
            if name:
                counts[name] = counts.get(name, 0) + 1

        speakers = [
            {"speaker": name, "count": count}
            for name, count in sorted(counts.items(), key=lambda x: -x[1])
        ]
        return JSONResponse({"speakers": [s["speaker"] for s in speakers]})
    except Exception as e:
        logger.error(f"Speakers Fetch Error: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/sermons")
async def get_sermons(
    speaker: Optional[str] = Query(None),
    search:  Optional[str] = Query(None),
    limit:   int           = Query(100, le=500),
    skip:    int           = Query(0),
):
    col = get_col()
    if not col:
        return JSONResponse({"sermons": []})
    
    try:
        filter_dict = {}

        # Speaker filter
        if speaker and speaker != "ALL":
            filter_dict["$or"] = [
                {"preacher": {"$regex": f"^{speaker}$", "$options": "i"}},
                {"speaker":  {"$regex": f"^{speaker}$", "$options": "i"}},
            ]

        # Search support
        if search:
            search_filter = {"$or": [
                {"title":               {"$regex": search, "$options": "i"}},
                {"sermon_title":        {"$regex": search, "$options": "i"}},
                {"content":             {"$regex": search, "$options": "i"}},
                {"scripture_reference": {"$regex": search, "$options": "i"}},
                {"series":              {"$regex": search, "$options": "i"}},
                {"preacher":            {"$regex": search, "$options": "i"}},
                {"speaker":             {"$regex": search, "$options": "i"}},
            ]}
            if filter_dict:
                filter_dict = {"$and": [filter_dict, search_filter]}
            else:
                filter_dict = search_filter

        cursor = col.find(filter_dict, limit=limit, skip=skip)
        return JSONResponse({"sermons": [map_sermon(s) for s in cursor]})
    except Exception as e:
        logger.error(f"Sermon Fetch Error: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/sermons/{sermon_id}")
async def get_sermon(sermon_id: str):
    """Returns single sermon with full content"""
    col = get_col()
    if not col:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    doc = col.find_one({"_id": sermon_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Sermon not found")
    return JSONResponse(map_sermon(doc))

@app.get("/sermons/debug")
async def debug_sermons():
    import traceback
    try:
        # Step 1: Test env vars
        token    = os.getenv("ASTRA_DB_TOKEN")
        # Try both common names
        endpoint = os.getenv("ASTRA_DB_ENDPOINT") or os.getenv("ASTRA_DB_API_ENDPOINT")
        
        if not token:    return {"error": "ASTRA_DB_TOKEN is missing from .env"}
        if not endpoint: return {"error": "ASTRA_DB_ENDPOINT/API_ENDPOINT is missing from .env"}

        # Step 2: Test DB connection
        client = DataAPIClient(token)
        # Using the standard keyspace or default
        db = client.get_database(endpoint, keyspace=os.getenv("ASTRA_DB_KEYSPACE", "default_keyspace"))

        # Step 3: Test collection access
        col = db.get_collection("sermons_archive")

        # Step 4: Test one document fetch
        doc = col.find_one({})
        if not doc:
            # Try list collections to see what's actually there
            colls = db.list_collection_names()
            return {
                "error": "Collection 'sermons_archive' is empty or name is wrong",
                "available_collections": colls
            }

        # Step 5: Show exact field names in your DB
        return {
            "status": "OK",
            "database_endpoint": endpoint[:20] + "...",
            "fields_in_your_db": list(doc.keys()),
            "sample_doc_content_keys": list(doc.get("content", {}).keys()) if isinstance(doc.get("content"), dict) else "content is not a dict",
            "sample_doc": {k: v for k, v in doc.items() if k != "_id"} # Exclude ID for simplicity
        }

    except Exception as e:
        return {"error": str(e), "trace": traceback.format_exc()}

@app.get("/health")
async def health_check():
    return {"status": "ok", "db": "AstraDB connected" if astra_db else "AstraDB missing"}
