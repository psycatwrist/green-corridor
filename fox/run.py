"""
Fox Backend Server Launcher
Run with: python run.py
"""
import sys
from pathlib import Path
import uvicorn

# Ensure the current directory is on the python path
ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

if __name__ == "__main__":
    print("=" * 60)
    print("Starting Fox Backend (Jaipur Hospitals & Ambulance Network)")
    print("API Docs: http://localhost:8000/docs")
    print("ReDoc:    http://localhost:8000/redoc")
    print("=" * 60)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True, app_dir=str(ROOT_DIR))
