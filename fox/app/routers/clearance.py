"""
Clearance Router for Fox Backend
Enables emergency route requests from Hospitals, command authorization from Traffic Police,
and status synchronization across in-cab driver terminals.
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Header

from app.models.clearance import (
    ClearanceCreateRequest,
    ClearanceGrantRequest,
    ClearanceOverrideRequest,
    ClearanceRecord,
)
from app.services.clearance_service import ClearanceService
from app.core.security import decode_jwt_token

router = APIRouter(prefix="/clearance", tags=["Emergency Clearance"])


@router.post(
    "/request",
    response_model=ClearanceRecord,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Emergency Green Corridor Request",
    description="Hospital CAD submits an emergency green corridor clearance request."
)
def create_clearance_request(
    request: ClearanceCreateRequest,
    authorization: Optional[str] = Header(None)
) -> ClearanceRecord:
    """Creates a new clearance request in the JTP command dispatch queue."""
    # If authorization header is provided, verify JWT token
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_jwt_token(token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Security token invalid or expired."
            )

    return ClearanceService.create_request(request)


@router.get(
    "/requests",
    response_model=List[ClearanceRecord],
    summary="Get All Clearance Requests in Queue",
    description="Retrieves the real-time emergency clearance queue."
)
def list_clearance_requests(
    hospital_key: Optional[str] = None,
    ambulance_id: Optional[str] = None
) -> List[ClearanceRecord]:
    """Returns all requests, optionally filtered by hospital or ambulance."""
    requests = ClearanceService.get_all_requests()
    if hospital_key:
        requests = [r for r in requests if r.hospital_key == hospital_key]
    if ambulance_id:
        requests = [r for r in requests if r.ambulance_id.upper() == ambulance_id.upper()]
    return requests


@router.get(
    "/{request_id}/status",
    response_model=ClearanceRecord,
    summary="Get Single Clearance Status",
    description="Drill-down for a driver terminal or hospital to poll request clearance status."
)
def get_clearance_status(request_id: str) -> ClearanceRecord:
    record = ClearanceService.get_request_by_id(request_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clearance request '{request_id}' not found."
        )
    return record


@router.post(
    "/{request_id}/grant",
    response_model=ClearanceRecord,
    summary="Grant Emergency Green Corridor Clearance",
    description="Traffic Admin authorizes green wave signal preemption."
)
def grant_clearance(
    request_id: str,
    payload: Optional[ClearanceGrantRequest] = None,
    authorization: Optional[str] = Header(None)
) -> ClearanceRecord:
    notes = payload.notes if payload else None
    record = ClearanceService.grant_clearance(request_id, notes)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clearance request '{request_id}' not found."
        )
    return record


@router.post(
    "/{request_id}/override",
    response_model=ClearanceRecord,
    summary="Override Corridor Route",
    description="Traffic Admin reroutes ambulance to an alternate corridor pathway."
)
def override_clearance(
    request_id: str,
    payload: ClearanceOverrideRequest,
    authorization: Optional[str] = Header(None)
) -> ClearanceRecord:
    record = ClearanceService.override_clearance(
        request_id,
        payload.new_route_key,
        payload.new_route_name,
        payload.reason
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clearance request '{request_id}' not found."
        )
    return record
