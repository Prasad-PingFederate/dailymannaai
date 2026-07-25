from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import os
import traceback
import logging
from bson.objectid import ObjectId

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from pymongo import MongoClient
    HAS_PYMONGO = True
except ImportError:
    HAS_PYMONGO = False
    logger.error("❌ pymongo not found. Run: pip install pymongo")

app = FastAPI(title="DailyMannaAI — Sermons API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "dailymannaai")

_mongo_client = None

def get_db():
    global _mongo_client
    if not HAS_PYMONGO:
        raise HTTPException(status_code=500, detail="pymongo library missing")
    if not MONGO_URI:
        raise HTTPException(status_code=500, detail="MongoDB URI missing in environment")
    try:
        if _mongo_client is None:
            _mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        return _mongo_client[MONGO_DB_NAME]
    except Exception as e:
        logger.error(f"❌ MongoDB Connection Failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

def get_col():
    return get_db().get_collection("sermons_archive")

def map_sermon(doc: dict) -> dict:
    return {
        "_id":                 str(doc.get("_id", "")),
        "speaker":             doc.get("preacher") or doc.get("speaker") or "Unknown Speaker",
        "sermon_title":        doc.get("title")    or doc.get("sermon_title") or "Untitled Message",
        "content":             doc.get("content", ""),
        "audio_url":           doc.get("audio_url") or doc.get("audioUrl", ""),
        "scripture_reference": doc.get("scripture_reference") or doc.get("scripture") or doc.get("reference", ""),
        "duration":            doc.get("duration", ""),
        "date":                doc.get("date", ""),
        "series":              doc.get("series") or doc.get("category", ""),
    }


# ══════════════════════════════════════════════════════════════
#  ⚠️  BUG 1 FIX — ROUTE ORDER
#  Specific routes BEFORE wildcard routes.
# ══════════════════════════════════════════════════════════════

# ── 1. SPEAKERS (specific — must be before /{sermon_id}) ──────
@app.get("/sermons/speakers")
async def get_speakers():
    try:
        col = get_col()
        cursor = col.find({}, {"preacher": True, "speaker": True, "_id": False}).limit(1000)
        docs = list(cursor)

        counts = {}
        for d in docs:
            name = (d.get("preacher") or d.get("speaker") or "").strip()
            if name:
                counts[name] = counts.get(name, 0) + 1

        sorted_speakers = [k for k, v in sorted(counts.items(), key=lambda x: -x[1])]
        return {"speakers": sorted_speakers}

    except Exception as e:
        logger.error(f"Speakers Error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# ── 2. DEBUG (specific — must be before /{sermon_id}) ─────────
@app.get("/sermons/debug")
async def debug_diagnostics():
    diag = {
        "HAS_PYMONGO":  HAS_PYMONGO,
        "ENV_MONGO_URI": "✅ Set" if MONGO_URI else "❌ MISSING",
        "DB_NAME":      MONGO_DB_NAME,
        "DB_TEST":      None,
        "COLLECTIONS":  None,
        "COL_TEST":     None,
        "SAMPLE_FIELDS":None,
        "ERROR":        None,
    }

    try:
        db = get_db()
        diag["DB_TEST"] = "✅ Connected"

        col_names = db.list_collection_names()
        diag["COLLECTIONS"] = col_names

        if "sermons_archive" in col_names:
            diag["COL_TEST"] = "✅ sermons_archive found"
            doc = db.get_collection("sermons_archive").find_one({})
            if doc:
                diag["SAMPLE_FIELDS"] = [k for k in doc.keys()]
                diag["SAMPLE_VALUES"] = {k: str(v)[:80] for k, v in doc.items()}
        else:
            diag["COL_TEST"] = f"❌ 'sermons_archive' NOT found. Available: {col_names}"

    except Exception as e:
        diag["ERROR"] = str(e)
        diag["TRACE"] = traceback.format_exc()

    return diag


# ── 3. LIST SERMONS ───────────────────────────────────────────
@app.get("/sermons")
async def get_sermons(
    speaker: Optional[str] = Query(None),
    search:  Optional[str] = Query(None),
    limit:   int           = Query(20, le=20),
    skip:    int           = Query(0),
):
    try:
        col = get_col()
        filter_dict = {}

        if speaker and speaker != "ALL":
            filter_dict["$or"] = [
                {"preacher": {"$regex": f"^{speaker}$", "$options": "i"}},
                {"speaker":  {"$regex": f"^{speaker}$", "$options": "i"}},
            ]

        if search:
            search_clause = {"$or": [
                {"title":               {"$regex": search, "$options": "i"}},
                {"sermon_title":        {"$regex": search, "$options": "i"}},
                {"preacher":            {"$regex": search, "$options": "i"}},
                {"speaker":             {"$regex": search, "$options": "i"}},
                {"scripture_reference": {"$regex": search, "$options": "i"}},
                {"content":             {"$regex": search, "$options": "i"}},
            ]}
            if filter_dict:
                filter_dict = {"$and": [filter_dict, search_clause]}
            else:
                filter_dict = search_clause

        results = list(col.find(filter_dict).limit(limit).skip(skip))
        return {"data": [map_sermon(s) for s in results]}

    except Exception as e:
        logger.error(f"Sermons Error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# ── 4. SINGLE SERMON (wildcard — must be LAST) ────────────────
@app.get("/sermons/{sermon_id}")
async def get_sermon(sermon_id: str):
    try:
        col = get_col()
        
        # Determine how to query the ID
        query = {"_id": sermon_id}
        if ObjectId.is_valid(sermon_id):
            query = {"$or": [{"_id": sermon_id}, {"_id": ObjectId(sermon_id)}]}

        doc = col.find_one(query)
        if not doc:
            raise HTTPException(status_code=404, detail="Sermon not found")
        return map_sermon(doc)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Single Sermon Error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# ── HEALTH ────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "online", "service": "DailyMannaAI Sermons", "db": "MongoDB"}
