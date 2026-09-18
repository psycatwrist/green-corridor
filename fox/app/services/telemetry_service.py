"""
Telemetry Service for Fox Backend
Caches live GPS telemetry packets from active ambulances.
Allows real-time display across Hospital CAD and Traffic Admin Command.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import threading


class TelemetryService:
    """Thread-safe live telemetry cache for ambulance units."""
    _lock = threading.Lock()
    _telemetry_cache: Dict[str, Dict[str, Any]] = {}
    _initialized = False

    @classmethod
    def _ensure_initialized(cls):
        with cls._lock:
            if cls._initialized:
                return
            now_iso = datetime.now(timezone.utc).isoformat()
            # Seed SMS and Apex active ambulance initial positions
            cls._telemetry_cache["AMB-SMS-01"] = {
                "hospital_key": "sms_hospital",
                "car_id": "AMB-SMS-01",
                "latitude": 26.9045,
                "longitude": 75.7590,
                "speed_kmh": 58.0,
                "heading": 124.0,
                "status": "in-service",
                "eta": "7m 40s",
                "distance_remaining": "3.8 km",
                "driver_name": "Rajesh Meena",
                "vehicle_number": "RJ-14-PA-1001",
                "vehicle_type": "ALS",
                "last_ping": now_iso
            }
            cls._telemetry_cache["AMB-APEX-01"] = {
                "hospital_key": "apex_hospital",
                "car_id": "AMB-APEX-01",
                "latitude": 26.8520,
                "longitude": 75.8200,
                "speed_kmh": 0.0,
                "heading": 0.0,
                "status": "in-service",
                "eta": "Standby",
                "distance_remaining": "0 km",
                "driver_name": "Vikram Rathore",
                "vehicle_number": "RJ-14-PA-1017",
                "vehicle_type": "ACS",
                "last_ping": now_iso
            }
            cls._initialized = True

    @classmethod
    def update_telemetry(
        cls,
        hospital_key: str,
        car_id: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Stores or updates live GPS telemetry for an ambulance."""
        cls._ensure_initialized()
        with cls._lock:
            key = car_id.upper()
            existing = cls._telemetry_cache.get(key, {})
            merged = {
                **existing,
                **data,
                "hospital_key": hospital_key,
                "car_id": car_id,
                "last_ping": datetime.now(timezone.utc).isoformat()
            }
            cls._telemetry_cache[key] = merged
            return merged

    @classmethod
    def get_latest(cls, car_id: str) -> Optional[Dict[str, Any]]:
        cls._ensure_initialized()
        with cls._lock:
            return cls._telemetry_cache.get(car_id.upper())

    @classmethod
    def get_all_live(cls) -> List[Dict[str, Any]]:
        cls._ensure_initialized()
        with cls._lock:
            return list(cls._telemetry_cache.values())
