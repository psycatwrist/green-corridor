import os
from pathlib import Path

# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Data directories
DATA_DIR = BASE_DIR / "data"
AUTH_DATA_DIR = DATA_DIR / "auth"
HOSPITALS_DATA_DIR = DATA_DIR / "hospitals"
CARS_DATA_DIR = DATA_DIR / "cars"

# JWT configuration
# In production, this can be overridden via environment variables
JWT_SECRET_KEY = os.getenv("FOX_JWT_SECRET", "green_corridor_fox_super_secret_jwt_key_2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = 60 * 24  # 24 hours token validity
