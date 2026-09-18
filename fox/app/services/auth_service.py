"""
Authentication Service
Handles authentication logic for:
- Hospital auth (Code 9) against data/auth/hospitals_auth.json
- Traffic Admin auth (Code 8) against data/auth/admins_auth.json

Response Code Specifications:
- 100: Authenticated successfully (returns JWT token)
- 110: Incorrect keypass but true key
- 200: UNAUTH (Key not found, invalid role code, or deactivated)
"""
import json
from typing import Dict, Any, Optional
from pathlib import Path

from app.config import AUTH_DATA_DIR
from app.core.security import verify_keypass, create_jwt_token, decode_jwt_token
from app.models.auth import AuthRequest, AuthResponse


class AuthService:
    """Service to manage authentication against JSON credential stores."""

    @staticmethod
    def _load_json(file_path: Path) -> Dict[str, Any]:
        """Utility to safely read JSON file from disk."""
        if not file_path.exists():
            return {}
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)

    @classmethod
    def authenticate(cls, req: AuthRequest) -> AuthResponse:
        """
        Main authentication entry point.
        Checks request code:
        - 9 -> Hospital authentication
        - 8 -> Traffic Admin authentication
        - any other code -> UNAUTH (200)
        """
        # 1. Determine target auth database by role code
        if req.code == 9:
            # Hospital Authentication
            db_path = AUTH_DATA_DIR / "hospitals_auth.json"
            list_key = "hospitals"
            role_name = "hospital"
        elif req.code == 8:
            # Traffic Admin Authentication
            db_path = AUTH_DATA_DIR / "admins_auth.json"
            list_key = "traffic_admins"
            role_name = "traffic_admin"
        else:
            # Unrecognized code -> Return 200 UNAUTH
            return AuthResponse(
                code=200,
                message="UNAUTH: Invalid role authorization code (must be 9 for Hospital or 8 for Admin)"
            )

        db_data = cls._load_json(db_path)
        records = db_data.get(list_key, [])

        # 2. Look up the key in the database
        target_record: Optional[Dict[str, Any]] = None
        for record in records:
            if record.get("key") == req.key:
                target_record = record
                break

        # If key does NOT exist in DB -> Return 200 UNAUTH
        if not target_record:
            return AuthResponse(
                code=200,
                message="UNAUTH: Key not found in authorization database"
            )

        # Check if record is active
        if not target_record.get("is_active", True):
            return AuthResponse(
                code=200,
                message="UNAUTH: Account or key has been deactivated"
            )

        # 3. Verify keypass
        stored_hash = target_record.get("keypass_hash", "")
        # Also check fallback raw_keypass if present
        raw_reference = target_record.get("raw_keypass_for_reference", "")

        is_valid = verify_keypass(req.keypass, stored_hash) or (
            raw_reference and verify_keypass(req.keypass, raw_reference)
        )

        if not is_valid:
            # True key exists, but keypass was incorrect -> Return 110
            return AuthResponse(
                code=110,
                message="Incorrect keypass but true key",
                role=role_name
            )

        # 4. Key and keypass are valid! Generate JWT Token
        entity_name = target_record.get("hospital_name") or target_record.get("name")
        jwt_payload = {
            "sub": req.key,
            "role": role_name,
            "entity_name": entity_name,
            "code": req.code
        }
        if "hospital_key" in target_record:
            jwt_payload["hospital_key"] = target_record["hospital_key"]
        if "admin_id" in target_record:
            jwt_payload["admin_id"] = target_record["admin_id"]

        token = create_jwt_token(jwt_payload)

        # Return 100 Authenticated
        return AuthResponse(
            code=100,
            message="Authenticated",
            token=token,
            token_type="bearer",
            role=role_name,
            entity_name=entity_name
        )

    @staticmethod
    def verify_token(token: str) -> Dict[str, Any]:
        """Decodes token and returns validity status."""
        payload = decode_jwt_token(token)
        if payload is None:
            return {"valid": False, "message": "Invalid or expired JWT token"}
        return {"valid": True, "payload": payload, "message": "Token is valid and active"}

    @classmethod
    def authenticate_driver(cls, driver_id: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Authenticates an ambulance driver against registered fleet files or known drivers.
        Returns driver session profile with assigned ambulance and JWT token.
        """
        from app.config import CARS_DATA_DIR
        clean_id = driver_id.strip().lower()

        # Known standard demo driver
        if clean_id in ["driver.rajesh", "rajesh", "drv-sms-01"] and password in ["Ambulance@123", "ambulance123", "sms_pass_2026"]:
            profile = {
                "id": driver_id,
                "name": "Rajesh Meena",
                "phone": "+91-98290-11234",
                "hospitalKey": "sms_hospital",
                "ambulanceId": "AMB-SMS-01",
                "vehicleType": "Advanced Life Support (ALS-01)",
                "licenseNumber": "RJ14-2015-004512",
                "status": "on-duty"
            }
            token = create_jwt_token({"sub": driver_id, "role": "driver", **profile})
            return {"profile": profile, "token": token}

        # Search across all cars files
        for f in CARS_DATA_DIR.glob("*.json"):
            data = cls._load_json(f)
            hosp_key = data.get("hospital_key", "")
            for car in data.get("in_service", []) + data.get("out_service", []):
                drv = car.get("driver_info") or {}
                d_id = drv.get("driver_id", "").lower() if drv else ""
                d_name = drv.get("name", "").lower() if drv else ""
                if clean_id and (clean_id == d_id or clean_id == d_name or (d_id and clean_id in d_id)):
                    # Accept demo passwords or driver pass
                    if password in ["Ambulance@123", "ambulance123", "123456", "greencorridor123"]:
                        profile = {
                            "id": driver_id,
                            "name": drv.get("name"),
                            "phone": drv.get("phone"),
                            "hospitalKey": hosp_key,
                            "ambulanceId": car.get("car_id"),
                            "vehicleType": car.get("car_info", {}).get("type", "ALS"),
                            "licenseNumber": drv.get("license_number"),
                            "status": "on-duty"
                        }
                        token = create_jwt_token({"sub": driver_id, "role": "driver", **profile})
                        return {"profile": profile, "token": token}

        return None

    @classmethod
    def register_hospital(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """Registers a new hospital with credentials."""
        hosp_name = data.get("name", "New Hospital").strip()
        slug = hosp_name.lower().replace(" ", "_").replace("(", "").replace(")", "").replace(".", "")[:20] + "_hospital"
        key = data.get("key") or f"{slug}_key"
        keypass = data.get("password") or data.get("keypass") or "Jaipur@2026"

        auth_path = AUTH_DATA_DIR / "hospitals_auth.json"
        auth_data = cls._load_json(auth_path)
        hospitals_list = auth_data.get("hospitals", [])

        # Check if already exists
        for h in hospitals_list:
            if h.get("key") == key or h.get("hospital_key") == slug:
                return {"status": "exists", "hospital_key": slug, "key": key}

        from app.core.security import hash_keypass
        new_entry = {
            "key": key,
            "keypass_hash": hash_keypass(keypass),
            "raw_keypass_for_reference": keypass,
            "hospital_key": slug,
            "hospital_name": hosp_name,
            "is_active": True
        }
        hospitals_list.append(new_entry)
        auth_data["hospitals"] = hospitals_list

        try:
            with open(auth_path, "w", encoding="utf-8") as f:
                json.dump(auth_data, f, indent=2)
        except Exception:
            pass

        return {
            "status": "success",
            "hospital_key": slug,
            "key": key,
            "hospital_name": hosp_name,
            "message": "Hospital registered successfully"
        }
