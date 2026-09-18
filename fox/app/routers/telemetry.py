"""
Telemetry Router for Fox Backend
Serves real-time fleet GPS coordinates to Command Centers and Hospital Portals.
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status

from app.services.telemetry_service import TelemetryService

router = APIRouter(prefix="/telemetry", tags=["Ambulance Telemetry"])


@router.get(
    "/live",
    response_model=List[Dict[str, Any]],
    summary="Get Live GPS Telemetry for All Active Ambulances",
    description="Returns latest GPS pings, speed, heading, and ETA for all broadcasting ambulances."
)
def get_all_live_telemetry() -> List[Dict[str, Any]]:
    return TelemetryService.get_all_live()


@router.get(
    "/{car_id}",
    response_model=Dict[str, Any],
    summary="Get Live Telemetry for Single Ambulance",
    description="Returns latest coordinates and telemetry for a specific ambulance ID."
)
def get_car_live_telemetry(car_id: str) -> Dict[str, Any]:
    record = TelemetryService.get_latest(car_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No live telemetry currently reported for ambulance '{car_id}'."
        )
    return record
