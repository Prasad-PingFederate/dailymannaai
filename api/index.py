import sys
import os
import traceback

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from backend.src.api import app as handler
    app = handler
except Exception as e:
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    
    app = FastAPI()
    
    @app.get("/{path:path}")
    async def catch_all(path: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Startup Error",
                "detail": str(e),
                "trace": traceback.format_exc(),
                "path": path,
                "sys_path": sys.path,
                "cwd": os.getcwd()
            }
        )
