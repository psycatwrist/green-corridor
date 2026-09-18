"""
Pydantic schemas for authentication requests and responses.
"""
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class AuthRequest(BaseModel):
    """
    Incoming authentication request model.
    - code: 9 for Hospital, 8 for Traffic Admin
    - key: Public/assigned identifier key
    - keypass: Secret pass key (can be encrypted or hashed)
    """
    code: int = Field(..., description="Role code: 9 for Hospital, 8 for Traffic Admin")
    key: str = Field(..., description="Identifier key (e.g., hospital ID or admin ID)")
    keypass: str = Field(..., description="Secret authentication pass key")

    class Config:
        json_schema_extra = {
            "example": {
                "code": 9,
                "key": "sms_hospital_key",
                "keypass": "sms_pass_jaipur_2026"
            }
        }


class AuthResponse(BaseModel):
    """
    Authentication response schema.
    Returns custom response codes:
    - 100: Authenticated
    - 110: Incorrect keypass but true key
    - 200: UNAUTH
    """
    code: int = Field(..., description="100=Authenticated, 110=Incorrect keypass, 200=UNAUTH")
    message: str = Field(..., description="Status message description")
    token: Optional[str] = Field(None, description="Signed JWT Bearer token (only if authenticated)")
    token_type: Optional[str] = Field("bearer", description="Token type")
    role: Optional[str] = Field(None, description="'hospital' or 'traffic_admin'")
    entity_name: Optional[str] = Field(None, description="Hospital or Admin name")


class TokenVerifyRequest(BaseModel):
    """
    Request payload to verify an existing JWT token.
    """
    token: str = Field(..., description="JWT token to verify")


class TokenVerifyResponse(BaseModel):
    """
    Result of JWT token verification.
    """
    valid: bool
    payload: Optional[Dict[str, Any]] = None
    message: str
