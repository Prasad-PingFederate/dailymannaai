import sys
import os

# Ensure project root is on Python path so `backend` package is discoverable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.src.api import app
from mangum import Mangum

# Mangum wraps FastAPI as a serverless ASGI handler for Vercel / AWS Lambda
handler = Mangum(app, lifespan="off")