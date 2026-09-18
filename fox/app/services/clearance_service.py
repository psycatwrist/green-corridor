"""
Clearance Service for Fox Backend
Maintains the real-time emergency green corridor clearance queue between
Hospitals and Jaipur Traffic Police Central Command.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import random
import threading

from app.models.clearance import (
    ClearanceCreateRequest,
    ClearanceRecord,
)


class ClearanceService:
    """Thread-safe clearance queue service."""
    _lock = threading.Lock()
    _queue: List[Dict[str, Any]] = []
    _initialized = False

    @classmethod
    def _ensure_initialized(cls):
        """Pre-seeds realistic initial queue records if empty."""
        with cls._lock:
            if cls._initialized:
                return
            now_str = datetime.now().strftime("%H:%M:%S")
            cls._queue = [
                {
                    "id": "REQ-SMS-4091",
                    "hospital_key": "sms_hospital",
                    "hospital_name": "Sawai Man Singh (SMS) Hospital",
                    "ambulance_id": "RJ-14-PA-1001",
                    "vehicle_type": "Advanced Life Support (ALS-01)",
                    "driver_name": "Rajesh Meena (+91-98290-11234)",
                    "severity": "code-red",
                    "severity_label": "Code Red • Critical",
                    "patient_vitals": "SpO2 86%, Pulse 132 bpm, BP 80/50",
                    "location": "Vaishali Nagar (Near Amrapali Circle)",
                    "destination_hospital_key": "sms_hospital",
                    "destination_hospital_name": "Sawai Man Singh (SMS) Hospital",
                    "route_key": "optimal",
                    "route_name": "JLN Marg Emergency Corridor",
                    "eta": "7 min 40 sec",
                    "status": "granted",
                    "status_label": "CLEARANCE GRANTED BY JTP COMMAND",
                    "created_at": now_str,
                    "granted_at": now_str,
                    "overridden_at": None,
                    "override_reason": None,
                    "hold_alert_sec": 90
                },
                {
                    "id": "REQ-APEX-2204",
                    "hospital_key": "apex_hospital",
                    "hospital_name": "Apex Hospital Malviya Nagar",
                    "ambulance_id": "RJ-14-PA-1017",
                    "vehicle_type": "Advanced Cardiac Support (ACS)",
                    "driver_name": "Vikram Rathore (+91-98291-55443)",
                    "severity": "code-yellow",
                    "severity_label": "Code Yellow • Urgent",
                    "patient_vitals": "Arrhythmia detected, Pulse 110 bpm",
                    "location": "Mansarovar (Kaveri Path T-Junction)",
                    "destination_hospital_key": "apex_hospital",
                    "destination_hospital_name": "Apex Hospital Malviya Nagar",
                    "route_key": "optimal",
                    "route_name": "Tonk Road - B2 Bypass Corridor",
                    "eta": "5 min 15 sec",
                    "status": "pending",
                    "status_label": "PENDING JTP DISPATCH CLEARANCE",
                    "created_at": now_str,
                    "granted_at": None,
                    "overridden_at": None,
                    "override_reason": None,
                    "hold_alert_sec": 120
                }
            ]
            cls._initialized = True

    @classmethod
    def create_request(cls, req: ClearanceCreateRequest) -> ClearanceRecord:
        cls._ensure_initialized()
        with cls._lock:
            # Generate clean request ID: e.g. REQ-SMS-5421
            prefix = req.hospital_key.split("_")[0].upper()
            rand_num = random.randint(1000, 9999)
            req_id = f"REQ-{prefix}-{rand_num}"
            now_str = datetime.now().strftime("%H:%M:%S")

            sev_label = "Code Red • Critical" if req.severity == "code-red" else "Code Yellow • Urgent"

            record_dict = {
                "id": req_id,
                "hospital_key": req.hospital_key,
                "hospital_name": req.hospital_name,
                "ambulance_id": req.ambulance_id,
                "vehicle_type": req.vehicle_type or "Advanced Life Support (ALS)",
                "driver_name": req.driver_name or "Assigned Driver",
                "severity": req.severity,
                "severity_label": req.severity_label or sev_label,
                "patient_vitals": req.patient_vitals or "Vitals stabilizing",
                "location": req.location,
                "destination_hospital_key": req.destination_hospital_key,
                "destination_hospital_name": req.destination_hospital_name,
                "route_key": req.route_key,
                "route_name": req.route_name,
                "eta": req.eta or "8 min",
                "status": "pending",
                "status_label": "PENDING JTP DISPATCH CLEARANCE",
                "created_at": now_str,
                "granted_at": None,
                "overridden_at": None,
                "override_reason": None,
                "hold_alert_sec": 120
            }

            # Put at front of queue
            cls._queue.insert(0, record_dict)
            return ClearanceRecord(**record_dict)

    @classmethod
    def get_all_requests(cls) -> List[ClearanceRecord]:
        cls._ensure_initialized()
        with cls._lock:
            return [ClearanceRecord(**r) for r in cls._queue]

    @classmethod
    def get_request_by_id(cls, req_id: str) -> Optional[ClearanceRecord]:
        cls._ensure_initialized()
        with cls._lock:
            for r in cls._queue:
                if r["id"].upper() == req_id.upper():
                    return ClearanceRecord(**r)
        return None

    @classmethod
    def grant_clearance(cls, req_id: str, notes: Optional[str] = None) -> Optional[ClearanceRecord]:
        cls._ensure_initialized()
        with cls._lock:
            for r in cls._queue:
                if r["id"].upper() == req_id.upper():
                    r["status"] = "granted"
                    r["status_label"] = "CLEARANCE GRANTED BY JTP COMMAND"
                    r["granted_at"] = datetime.now().strftime("%H:%M:%S")
                    if notes:
                        r["override_reason"] = f"Commander Notes: {notes}"
                    return ClearanceRecord(**r)
        return None

    @classmethod
    def override_clearance(
        cls,
        req_id: str,
        new_route_key: str,
        new_route_name: str,
        reason: Optional[str] = None
    ) -> Optional[ClearanceRecord]:
        cls._ensure_initialized()
        with cls._lock:
            for r in cls._queue:
                if r["id"].upper() == req_id.upper():
                    r["status"] = "granted"
                    r["route_key"] = new_route_key
                    r["route_name"] = new_route_name
                    r["overridden_at"] = datetime.now().strftime("%H:%M:%S")
                    r["override_reason"] = reason or "JTP Command Dynamic Reroute"
                    r["status_label"] = f"REROUTED BY JTP: {new_route_name.upper()}"
                    return ClearanceRecord(**r)
        return None
