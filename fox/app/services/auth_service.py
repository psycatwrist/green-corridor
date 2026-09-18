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
