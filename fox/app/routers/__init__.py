from app.routers.auth import router as auth_router
from app.routers.hospitals import router as hospitals_router
from app.routers.clearance import router as clearance_router
from app.routers.telemetry import router as telemetry_router
from app.routers.routing import router as routing_router

__all__ = [
    "auth_router",
    "hospitals_router",
    "clearance_router",
    "telemetry_router",
    "routing_router"
]

