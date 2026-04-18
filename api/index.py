import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from backend.src.api import app
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")
except Exception as e:
    # Diagnostic fallback — shows WHY the import failed
    from fastapi import FastAPI
    from mangum import Mangum

    _err = str(e)
    _path = sys.path
    _cwd = os.getcwd()
    try:
        _files = os.listdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    except:
        _files = []

    app = FastAPI()

    @app.get("/{path:path}")
    async def catch_all(path: str):
        return {
            "error": "IMPORT_FAILED",
            "detail": _err,
            "python_path": _path,
            "cwd": _cwd,
            "root_files": _files
        }

    handler = Mangum(app, lifespan="off")