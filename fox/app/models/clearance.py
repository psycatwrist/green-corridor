"""
Pydantic schemas for Emergency Green Corridor Route Clearance requests.
Used for communication between Hospital CAD and Traffic Police Command.
"""
from typing import Optional
from pydantic import BaseModel, Field


class ClearanceCreateRequest(BaseModel):
    """Payload sent by Hospital to request an emergency Green Corridor."""
    hospital_key: str = Field(..., description="Requesting hospital slug (e.g. sms_hospital)")
    hospital_name: str = Field(..., description="Full hospital name")
    ambulance_id: str = Field(..., description="Ambulance unit registration or ID")
    vehicle_type: Optional[str] = Field("Advanced Life Support (ALS)", description="Vehicle tier")
    driver_name: Optional[str] = Field("Assigned Driver", description="Driver name & contact")
    severity: str = Field("code-red", description="'code-red' (Critical) or 'code-yellow' (Urgent)")
    severity_label: Optional[str] = None
    patient_vitals: Optional[str] = Field("SpO2 88%, Pulse 124 bpm", description="Patient clinical status")
    location: str = Field(..., description="Current origin / dispatch location")
    destination_hospital_key: Optional[str] = None
    destination_hospital_name: Optional[str] = None
    route_key: str = Field("optimal", description="Selected corridor route key")
    route_name: str = Field("Primary Green Corridor", description="Corridor pathway name")
    eta: Optional[str] = Field("7 min 40 sec", description="Estimated arrival time")


class ClearanceGrantRequest(BaseModel):
    """Payload sent by Traffic Admin to authorize green wave clearance."""
    notes: Optional[str] = Field(None, description="Optional command dispatch notes")


class ClearanceOverrideRequest(BaseModel):
    """Payload sent by Traffic Admin to reroute an active corridor."""
    new_route_key: str = Field(..., description="Alternative route key (e.g. alt-a, alt-b)")
    new_route_name: str = Field(..., description="Name of overriding corridor")
    reason: Optional[str] = Field("Traffic congestion preemption", description="Justification")


class ClearanceRecord(BaseModel):
    """Full clearance request lifecycle record stored in backend queue."""
    id: str = Field(..., description="Unique clearance request ID (e.g. REQ-SMS-4091)")
    hospital_key: str
    hospital_name: str
    ambulance_id: str
    vehicle_type: str
    driver_name: str
    severity: str
    severity_label: str
    patient_vitals: str
    location: str
    destination_hospital_key: Optional[str] = None
    destination_hospital_name: Optional[str] = None
    route_key: str
    route_name: str
    eta: str
    status: str = Field("pending", description="'pending', 'granted', 'overridden', 'completed'")
    status_label: str
    created_at: str
    granted_at: Optional[str] = None
    overridden_at: Optional[str] = None
    override_reason: Optional[str] = None
    hold_alert_sec: int = 120
