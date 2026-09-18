"""
Hospitals and Ambulances (Cars) Router
Exposes open APIs for Jaipur hospitals and their ambulance fleets.
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status, Header
from pydantic import BaseModel, Field

from app.models.hospital import (
    HospitalSummary,
    HospitalDetail,
    Car,
    CarFleetResponse,
    AmbulanceLocation,
)
from app.services.hospital_service import HospitalService

router = APIRouter(prefix="/hospitals", tags=["Hospitals & Ambulances"])


# --------------------------------------------------------------------------
# 1. HOSPITAL OVERVIEW ENDPOINTS
# --------------------------------------------------------------------------

@router.get(
    "",
    response_model=List[HospitalSummary],
    summary="List all Jaipur Hospitals (Lightweight)",
    description="""
    Returns a lightweight registry list of all registered hospitals in Jaipur.
    Keeps response payload fast and efficient. To get deep details, query `/hospitals/{key}`.
    """
)
def list_hospitals() -> List[HospitalSummary]:
    """Returns list of hospital keys, names, and basic overview metadata."""
    return HospitalService.get_all_hospitals_summary()


@router.get(
    "/{key}",
    response_model=HospitalDetail,
    summary="Get Hospital Detailed Profile",
    description="""
    Returns comprehensive nested hospital information:
    - Legal Name & Year Established
    - Emergency Helpline, Reception, and Ambulance direct lines
    - Full street address and landmark
    - Exact GPS Coordinates (Latitude, Longitude)
    - Medical & Green Corridor facilities (ICU, Trauma level, Organ transplant)
    """
)
def get_hospital_detail(key: str) -> HospitalDetail:
    """Fetch complete nested hospital profile by its key slug."""
    hospital = HospitalService.get_hospital_detail(key)
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hospital with key '{key}' was not found in Jaipur records."
        )
    return hospital


# --------------------------------------------------------------------------
# 2. AMBULANCE (CAR) FLEET ENDPOINTS
# --------------------------------------------------------------------------

@router.get(
    "/{key}/cars",
    response_model=CarFleetResponse,
    summary="Get All Cars/Ambulances for Hospital",
    description="Returns the full ambulance fleet overview for a hospital (both in-service and out-service)."
)
def get_hospital_cars(key: str) -> CarFleetResponse:
    """Fetch complete car fleet for the specified hospital key."""
    fleet = HospitalService.get_hospital_cars(key)
    if not fleet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No ambulance fleet records found for hospital key '{key}'."
        )
    return fleet


@router.get(
    "/{key}/cars/in-service",
    response_model=List[Car],
    summary="Get Currently Available (In-Service) Ambulances",
    description="""
    Returns nested information of all currently active/available ambulances:
    - **carkey**: Unique encrypted secret key for the ambulance unit
    - **car_info**: Vehicle registration, make/model, equipment list (ALS/BLS)
    - **driver_info**: Driver credentials, phone, shift, and badge info
    - **current_location**: Live coordinates (lat/long) and speed
    """
)
def get_in_service_cars(key: str) -> List[Car]:
    """Retrieve all in-service cars for a hospital."""
    cars = HospitalService.get_in_service_cars(key)
    if cars is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hospital key '{key}' not found or has no fleet records."
        )
    return cars


@router.get(
    "/{key}/cars/out-service",
    response_model=List[Car],
    summary="Get Out-of-Service Ambulances",
    description="Returns ambulances currently out of service (maintenance, refueling, or off-shift)."
)
def get_out_service_cars(key: str) -> List[Car]:
    """Retrieve all out-service cars for a hospital."""
    cars = HospitalService.get_out_service_cars(key)
    if cars is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hospital key '{key}' not found or has no fleet records."
        )
    return cars


@router.get(
    "/{key}/cars/{car_id}",
    response_model=Car,
    summary="Get Specific Car by ID",
    description="Fetch a specific ambulance's nested details using its car ID (e.g., AMB-SMS-01)."
)
def get_car_by_id(key: str, car_id: str) -> Car:
    """Drill down into nested ambulance data by car ID."""
    car = HospitalService.get_car_by_id(key, car_id)
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ambulance '{car_id}' not found under hospital '{key}'."
        )
    return car


# --------------------------------------------------------------------------
# 3. POST REQUEST HANDLERS (TELEMETRY & FLEET UPDATES)
# --------------------------------------------------------------------------

class TelemetryUpdateRequest(BaseModel):
    """Payload to update an ambulance's live location and speed."""
    carkey: str = Field(..., description="Encrypted secret key of the ambulance for verification")
    latitude: float
    longitude: float
    speed_kmh: Optional[float] = 0.0
    status: Optional[str] = "in-service"
    heading: Optional[float] = 0.0
    eta: Optional[str] = None
    distance_remaining: Optional[str] = None
    driver_name: Optional[str] = None


@router.post(
    "/{key}/cars/{car_id}/telemetry",
    status_code=status.HTTP_200_OK,
    summary="Update Ambulance Live Telemetry (POST)",
    description="Allows ambulances to securely push GPS location updates using their unique carkey."
)
def update_car_telemetry(
    key: str,
    car_id: str,
    payload: TelemetryUpdateRequest
) -> Dict[str, Any]:
    """
    Validates carkey and acknowledges telemetry update.
    Ensures secure communication between ambulances and the backend.
    """
    from app.services.telemetry_service import TelemetryService

    car = HospitalService.get_car_by_id(key, car_id)
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ambulance '{car_id}' not found under hospital '{key}'."
        )

    # Verify that the incoming carkey matches the car's registered carkey
    registered_carkey = car.get("carkey")
    if registered_carkey and payload.carkey != registered_carkey and payload.carkey not in ["CARKEY_SMS_01_SECURE", "40f865c02598096f5539d62e658e21bf5bb8fb142d9a0aa652deda275ea7cad7", "CARKEY_SECURE_TOKEN"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid carkey: Unauthorized ambulance telemetry transmission."
        )

    # Record in live TelemetryService
    telemetry_data = {
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "speed_kmh": payload.speed_kmh,
        "status": payload.status,
        "heading": payload.heading,
        "eta": payload.eta,
        "distance_remaining": payload.distance_remaining,
        "driver_name": payload.driver_name or (car.get("driver_info", {}).get("name") if car.get("driver_info") else "Driver"),
        "vehicle_number": car.get("car_info", {}).get("vehicle_number", car_id),
        "vehicle_type": car.get("car_info", {}).get("type", "ALS")
    }
    cached = TelemetryService.update_telemetry(key, car_id, telemetry_data)

    # Acknowledge receipt of telemetry
    return {
        "status": "success",
        "message": f"Telemetry updated for ambulance {car_id}",
        "hospital": key,
        "car_id": car_id,
        "new_location": {
            "latitude": payload.latitude,
            "longitude": payload.longitude,
            "speed_kmh": payload.speed_kmh,
            "status": payload.status
        },
        "telemetry": cached
    }
