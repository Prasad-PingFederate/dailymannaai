import os
import json
import logging
import asyncio
from typing import List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
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

def get_astra_db():
    token = os.getenv("ASTRA_DB_TOKEN")
    endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")
    
    if not token or not endpoint:
        logger.warning("⚠️ [AstraDB] Missing ASTRA_DB_TOKEN or ASTRA_DB_API_ENDPOINT.")
        return None
    
    try:
        client = DataAPIClient(token)
        # Using the correct namespace and endpoint mapping for 80GB archive
        db = client.get_database(endpoint)
        return db
    except Exception as e:
        logger.error(f"❌ [AstraDB] Connection failed: {e}")
        return None

astra_db = get_astra_db()

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

@app.get("/sermons")
async def get_sermons(speaker: Optional[str] = None, limit: int = 50):
    """
    Fetch anointed messages from the 'sermons_archive' collection.
    Mapped for DailyMannaAI design language.
    """
    if not astra_db:
        # Fallback to dummy data for local testing if DB not configured
        return JSONResponse({"sermons": []})
    
    try:
        # CORRECT COLLECTION NAME: sermons_archive
        collection = astra_db.get_collection("sermons_archive")
        
        # Build query - DATABASE USES 'preacher' FIELD
        filter_dict = {}
        if speaker and speaker != "ALL":
            filter_dict = {"preacher": speaker}
        
        # Fetching documents
        cursor = collection.find(filter_dict, limit=limit)
        raw_sermons = list(cursor)
        
        # MAPPING FOR FRONTEND:
        # DB Fields: title, preacher, content, audioUrl, date
        # Frontend expects: sermon_title, speaker, content, audio_url, date
        formatted = []
        for s in raw_sermons:
            formatted.append({
                "_id": str(s.get("_id", "")),
                "sermon_title": s.get("title", "Untitled Message"),
                "speaker": s.get("preacher", "Unknown Preacher"),
                "content": s.get("content", ""),
                "audio_url": s.get("audioUrl", ""),
                "date": s.get("date", ""),
                "scripture_reference": s.get("scripture", s.get("reference", "")),
                "duration": s.get("duration", "")
            })
                
        return JSONResponse({"sermons": formatted})
    except Exception as e:
        logger.error(f"Sermon Fetch Error: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/sermons/speakers")
async def get_speakers():
    """
    Retrieve unique anointed preachers from the 'sermons_archive' collection.
    """
    if not astra_db:
        return JSONResponse({"speakers": []})
        
    try:
        collection = astra_db.get_collection("sermons_archive")
        
        # Sampling speakers (Astra DB limit)
        cursor = collection.find({}, limit=1000, projection={"preacher": True})
        # Map DB 'preacher' to frontend speakers list
        speakers = sorted(list(set(s.get("preacher") for s in cursor if s.get("preacher"))))
        
        return JSONResponse({"speakers": speakers})
    except Exception as e:
        logger.error(f"Speakers Fetch Error: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/health")
async def health_check():
    return {"status": "ok", "db": "AstraDB connected" if astra_db else "AstraDB missing"}
