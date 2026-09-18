"""
Fox Backend Application Entrypoint
Open FastAPI backend for Jaipur Hospitals and Emergency Green Corridor Ambulance Fleet.
"""
import sys
from pathlib import Path

# Add project root directory to sys.path so 'app' can be imported when running 'python app/main.py' or 'python main.py' directly
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    auth_router,
    hospitals_router,
    clearance_router,
    telemetry_router,
    routing_router
)

# Initialize the FastAPI application
app = FastAPI(
    title="Fox Backend - Jaipur Hospitals & Ambulance Open API",
    description="""
    ## Welcome to Fox Backend 🦊🚑
    An Open FastAPI backend designed for Jaipur's Emergency Healthcare and Green Corridor network.
    
    ### Key Features:
    1. **Dual-Role Authentication**:
       - Role `9`: Hospital credentials verification
       - Role `8`: Traffic Admin credentials verification
       - Driver In-Cab Authentication (`/auth/driver/login`)
    2. **Open Hospital Registry**:
       - Fast lightweight directory (`/hospitals`)
       - Detailed nested profiles with GPS coordinates & trauma facilities (`/hospitals/{key}`)
    3. **Ambulance Fleet Management**:
       - In-service (`/hospitals/{key}/cars/in-service`) and Out-service (`/hospitals/{key}/cars/out-service`)
       - Secret unique vehicle `carkey` security & live telemetry update via POST
    4. **Emergency Clearance Network (Page-to-Backend-to-Page)**:
       - Hospital corridor request (`POST /clearance/request`)
       - Police command approval & override (`POST /clearance/{id}/grant`)
       - Live queue sync across all devices (`GET /clearance/requests`)
    5. **Live Fleet GPS Telemetry**:
       - Vehicle GPS streaming & broadcast (`GET /telemetry/live`)
    6. **OSRM Real Street Driving & Green Wave ETA**:
       - Turn-by-turn routing with OpenStreetMap road geometry (`GET /routing/route`)
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS (Cross-Origin Resource Sharing) for seamless frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits requests from all origins (frontend apps, web dashboards)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(hospitals_router)
app.include_router(clearance_router)
app.include_router(telemetry_router)
app.include_router(routing_router)


@app.get("/", tags=["Root"])
def root_index():
    """
    API Root Directory and Health Check.
    Provides immediate guidance and navigation links for developers and clients.
    """
    return {
        "project": "Fox Backend",
        "city": "Jaipur, Rajasthan",
        "purpose": "Open Hospital & Green Corridor Ambulance API",
        "status": "online",
        "version": "2.0.0",
        "documentation": "/docs",
        "endpoints": {
            "auth_login": "POST /auth/login (code 9 for hospital, code 8 for admin)",
            "auth_driver_login": "POST /auth/driver/login",
            "auth_verify": "POST /auth/verify",
            "hospitals_list": "GET /hospitals",
            "hospital_detail": "GET /hospitals/{key}",
            "hospital_cars": "GET /hospitals/{key}/cars",
            "cars_in_service": "GET /hospitals/{key}/cars/in-service",
            "cars_out_service": "GET /hospitals/{key}/cars/out-service",
            "car_drilldown": "GET /hospitals/{key}/cars/{car_id}",
            "car_telemetry_post": "POST /hospitals/{key}/cars/{car_id}/telemetry",
            "telemetry_live": "GET /telemetry/live",
            "clearance_requests": "GET /clearance/requests",
            "clearance_request_post": "POST /clearance/request",
            "clearance_grant": "POST /clearance/{id}/grant",
            "clearance_override": "POST /clearance/{id}/override",
            "routing_osrm": "GET /routing/route"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True, app_dir=str(ROOT_DIR))
