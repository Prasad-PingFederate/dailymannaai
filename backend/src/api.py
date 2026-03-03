from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import os
import traceback
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from astrapy import DataAPIClient
    HAS_ASTRAPY = True
except ImportError:
    HAS_ASTRAPY = False
    logger.error("❌ astrapy not found. Run: pip install astrapy")

app = FastAPI(title="DailyMannaAI — Sermons API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ASTRA_TOKEN    = os.getenv("ASTRA_DB_APPLICATION_TOKEN") or os.getenv("ASTRA_DB_TOKEN")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")     or os.getenv("ASTRA_DB_ENDPOINT")
ASTRA_KEYSPACE = os.getenv("ASTRA_DB_NAMESPACE")         or os.getenv("ASTRA_DB_KEYSPACE", "default_keyspace")

def get_db():
    if not HAS_ASTRAPY:
        raise HTTPException(status_code=500, detail="astrapy library missing")
    if not ASTRA_TOKEN or not ASTRA_ENDPOINT:
        raise HTTPException(status_code=500, detail="Astra DB credentials missing in environment")
    try:
        client = DataAPIClient(ASTRA_TOKEN)
        # BUG 3 FIX: use get_database_by_api_endpoint() not get_database()
        return client.get_database_by_api_endpoint(ASTRA_ENDPOINT, keyspace=ASTRA_KEYSPACE)
    except Exception as e:
        logger.error(f"❌ Astra Connection Failed: {str(e)}")
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
        # BUG 4 FIX: projection including _id: False
        cursor = col.find({}, projection={"preacher": True, "speaker": True, "_id": False}, limit=1000)
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
        "HAS_ASTRAPY":  HAS_ASTRAPY,
        "ENV_TOKEN":    "✅ Set" if ASTRA_TOKEN    else "❌ MISSING",
        "ENV_ENDPOINT": "✅ Set" if ASTRA_ENDPOINT else "❌ MISSING",
        "ASTRA_ENDPOINT_PREVIEW": (ASTRA_ENDPOINT[:40] + "...") if ASTRA_ENDPOINT else None,
        "KEYSPACE":     ASTRA_KEYSPACE,
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
                diag["SAMPLE_FIELDS"] = [k for k in doc.keys() if k != "$vector"]
                diag["SAMPLE_VALUES"] = {
                    k: str(v)[:80]
                    for k, v in doc.items()
                    if k != "$vector"
                }
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
    limit:   int           = Query(100, le=500),
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
            filter_dict = {"$and": [filter_dict, search_clause]} if filter_dict else search_clause

        results = list(col.find(filter_dict, limit=limit, skip=skip))

        # BUG 2 FIX: return {"data": [...]}
        return {"data": [map_sermon(s) for s in results]}

    except Exception as e:
        logger.error(f"Sermons Error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# ── 4. SINGLE SERMON (wildcard — must be LAST) ────────────────
@app.get("/sermons/{sermon_id}")
async def get_sermon(sermon_id: str):
    try:
        col = get_col()
        doc = col.find_one({"_id": sermon_id})
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
    return {"status": "online", "service": "DailyMannaAI Sermons", "db": "AstraDB"}
