from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import os, traceback

# Import the DataAPIClient here so it's available for the routes
try:
    from astrapy import DataAPIClient
except ImportError:
    DataAPIClient = None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ── Step 1: Check env vars exist
# Supporting multiple naming conventions for Astra DB credentials
ASTRA_TOKEN    = os.getenv("ASTRA_DB_APPLICATION_TOKEN") or os.getenv("ASTRA_DB_TOKEN", "")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT") or os.getenv("ASTRA_DB_ENDPOINT", "")
ASTRA_KEYSPACE = os.getenv("ASTRA_DB_NAMESPACE") or os.getenv("ASTRA_DB_KEYSPACE", "default_keyspace")

# ══════════════════════════════════════════════════
#  DEBUG ROUTE — visit this in browser first
#  GET /sermons/debug
# ══════════════════════════════════════════════════
@app.get("/sermons/debug")
async def debug():
    result = {
        "step1_env_token":    "✅ Found" if ASTRA_TOKEN    else "❌ MISSING — add ASTRA_DB_TOKEN to Vercel env vars",
        "step1_env_endpoint": "✅ Found" if ASTRA_ENDPOINT else "❌ MISSING — add ASTRA_DB_ENDPOINT to Vercel env vars",
        "step1_env_keyspace": ASTRA_KEYSPACE,
        "step2_import":       None,
        "step3_connect":      None,
        "step4_collection":   None,
        "step5_sample_doc":   None,
        "step5_field_names":  None,
        "error":              None,
    }

    # Step 2: Try importing astrapy
    if DataAPIClient is None:
        result["step2_import"] = "❌ astrapy import failed"
        result["error"] = "Run: pip install astrapy"
        return result
    else:
        result["step2_import"] = "✅ astrapy imported OK"

    # Step 3: Try connecting
    try:
        client = DataAPIClient(ASTRA_TOKEN)
        # Using the standard get_database which is more robust
        db = client.get_database(ASTRA_ENDPOINT, keyspace=ASTRA_KEYSPACE)
        result["step3_connect"] = "✅ Connected to AstraDB"
    except Exception as e:
        result["step3_connect"] = f"❌ Connection failed: {str(e)}"
        result["error"] = traceback.format_exc()
        return result

    # Step 4: Try getting collection
    try:
        col = db.get_collection("sermons_archive")
        result["step4_collection"] = "✅ Got collection: sermons_archive"
    except Exception as e:
        result["step4_collection"] = f"❌ Collection failed: {str(e)}"
        result["error"] = traceback.format_exc()
        return result

    # Step 5: Try fetching one doc
    try:
        doc = col.find_one({})
        if doc:
            result["step5_sample_doc"]  = "✅ Got a document"
            result["step5_field_names"] = list(doc.keys())   # ← SHOWS REAL FIELD NAMES
            result["step5_sample_values"] = {
                k: str(v)[:80] for k, v in doc.items()       # ← SHOWS REAL VALUES
                if k != "$vector"                             # skip the vector blob
            }
        else:
            result["step5_sample_doc"] = "⚠️ Collection is empty"
    except Exception as e:
        result["step5_sample_doc"] = f"❌ find_one failed: {str(e)}"
        result["error"] = traceback.format_exc()

    return result


# ══════════════════════════════════════════════════
#  SERMONS ROUTE — with full error logging
# ══════════════════════════════════════════════════
def get_col():
    if DataAPIClient is None:
        raise HTTPException(status_code=500, detail="astrapy not installed")
    client = DataAPIClient(ASTRA_TOKEN)
    db = client.get_database(ASTRA_ENDPOINT, keyspace=ASTRA_KEYSPACE)
    return db.get_collection("sermons_archive")

def map_sermon(s: dict) -> dict:
    return {
        "_id":                 str(s.get("_id", "")),
        "speaker":             s.get("preacher") or s.get("speaker", "Unknown"),
        "sermon_title":        s.get("title")    or s.get("sermon_title", "Untitled"),
        "content":             s.get("content", ""),
        "audio_url":           s.get("audio_url") or s.get("audioUrl", ""),
        "scripture_reference": s.get("scripture_reference") or s.get("scripture", s.get("reference", "")),
        "duration":            s.get("duration", ""),
        "date":                s.get("date", ""),
        "series":              s.get("series") or s.get("category", ""),
    }

@app.get("/sermons/speakers")
async def get_speakers():
    try:
        col = get_col()
        docs = list(col.find({}, projection={"preacher": True, "speaker": True, "_id": False}, limit=1000))
        counts: dict = {}
        for doc in docs:
            name = (doc.get("preacher") or doc.get("speaker") or "").strip()
            if name:
                counts[name] = counts.get(name, 0) + 1
        speakers = [{"speaker": k, "count": v} for k, v in sorted(counts.items(), key=lambda x: -x[1])]
        return {"speakers": [s["speaker"] for s in speakers]}
    except Exception as e:
        print("SPEAKERS ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"speakers error: {str(e)}")

@app.get("/sermons")
async def get_sermons(
    speaker: Optional[str] = None,
    search:  Optional[str] = None,
    limit:   int = 100,
    skip:    int = 0,
):
    try:
        col = get_col()
        filter_dict: dict = {}

        if speaker and speaker != "ALL":
            filter_dict["$or"] = [
                {"preacher": speaker},
                {"speaker":  speaker},
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

        results = list(col.find(filter_dict, limit=limit, skip=skip))
        return {"sermons": [map_sermon(s) for s in results]}

    except Exception as e:
        print("SERMONS ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"sermons error: {str(e)}")

@app.get("/sermons/{sermon_id}")
async def get_sermon(sermon_id: str):
    try:
        col = get_col()
        doc = col.find_one({"_id": sermon_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Not found")
        return map_sermon(doc)
    except HTTPException:
        raise
    except Exception as e:
        print("SERMON_ID ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"sermon id error: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "ok", "astra": "Available" if DataAPIClient else "Unavailable"}
