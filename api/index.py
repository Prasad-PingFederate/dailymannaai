import sys
import os

# Ensure the project root is on the path so `backend` package is found
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.src.api import app
