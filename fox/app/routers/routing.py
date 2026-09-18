"""
Routing Router for Fox Backend
Exposes live street routing and Green Corridor ETA calculation.
"""
from typing import Dict, Any
from fastapi import APIRouter, Query

from app.services.routing_service import RoutingService

router = APIRouter(prefix="/routing", tags=["OSRM Routing"])


@router.get(
    "/route",
    response_model=Dict[str, Any],
    summary="Get Real Street Road Path & ETA via OSRM",
    description="""
    Queries OSRM driving engine to get actual street geometries and turn steps.
    Applies Green Wave preemption speed boost in emergency mode.
    """
)
def get_driving_route(
    start_lat: float = Query(..., description="Origin latitude"),
    start_lon: float = Query(..., description="Origin longitude"),
    dest_lat: float = Query(..., description="Destination latitude"),
    dest_lon: float = Query(..., description="Destination longitude"),
    mode: str = Query("emergency", description="'emergency' or 'routine'")
) -> Dict[str, Any]:
    return RoutingService.get_route(start_lat, start_lon, dest_lat, dest_lon, mode)
