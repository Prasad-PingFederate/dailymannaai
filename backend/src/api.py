from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import JSONResponse
from celery.result import AsyncResult
import asyncio
import json
import logging
from src.tasks import crawl_query_task
from src.models import SessionLocal, Content
# from src.es_client import search as es_search

app = FastAPI(title="Dailymanna On-Demand Crawler")
logger = logging.getLogger(__name__)

# Store active WebSocket connections per task
active_connections = {}

@app.get("/search")
async def search(q: str = Query(..., description="Search query")):
    """
    Trigger an on-demand crawl for the given query.
    Returns a task_id that can be used to poll or connect via WebSocket.
    """
    task = crawl_query_task.delay(q)
    return JSONResponse({"task_id": task.id, "query": q})

@app.get("/result/{task_id}")
async def get_result(task_id: str):
    """
    Polling endpoint to get the status and results of a crawl task.
    """
    task = AsyncResult(task_id, app=crawl_query_task.app)
    if task.state == 'PENDING':
        return JSONResponse({"state": "PENDING"})
    elif task.state == 'FAILURE':
        return JSONResponse({"state": "FAILURE", "error": str(task.info)})
    elif task.state == 'SUCCESS':
        # task.info contains the list of content ids
        content_ids = task.result
        # Fetch content details from database
        db = SessionLocal()
        contents = db.query(Content).filter(Content.id.in_(content_ids)).all()
        db.close()
        return JSONResponse({
            "state": "SUCCESS",
            "results": [content.to_dict() for content in contents]
        })
    else:
        return JSONResponse({"state": task.state, "info": task.info})

@app.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    """
    WebSocket endpoint to stream results in real-time as they are crawled.
    """
    await websocket.accept()
    active_connections[task_id] = websocket
    try:
        while True:
            # Keep connection alive; client may send ping
            await websocket.receive_text()
    except WebSocketDisconnect:
        if task_id in active_connections:
            del active_connections[task_id]

# Helper to send a message to a specific task's WebSocket
async def send_result(task_id: str, message: dict):
    if task_id in active_connections:
        await active_connections[task_id].send_json(message)
