"""
Authentication Router
Handles login and token verification for Hospitals and Traffic Admins.
"""
from typing import Optional
from fastapi import APIRouter, status, HTTPException
from pydantic import BaseModel
from app.models.auth import AuthRequest, AuthResponse, TokenVerifyRequest, TokenVerifyResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate Hospital or Traffic Admin",
    description="""
    Authenticates an entity using:
    - **code**: Role code (9 for Hospital, 8 for Traffic Admin)
    - **key**: Public or assigned identifier key
    - **keypass**: Secret pass key (can be plaintext, hashed, or encrypted)

    **Response Codes**:
    - `100`: Authenticated successfully (returns signed JWT token)
    - `110`: Incorrect keypass but true key
    - `200`: UNAUTH (Key not found, wrong role code, or deactivated)
    """
)
def login(request: AuthRequest) -> AuthResponse:
    """
    Evaluates key and keypass against JSON database and returns
    custom status code (100, 110, or 200) with JWT.
    """
    return AuthService.authenticate(request)


@router.post(
    "/verify",
    response_model=TokenVerifyResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify JWT Token",
    description="Verifies the signature and expiration time of a JWT Bearer token."
)
def verify_token(request: TokenVerifyRequest) -> TokenVerifyResponse:
    """
    Decodes the JWT token to verify it hasn't been intercepted, tampered, or expired.
    """
    result = AuthService.verify_token(request.token)
    return TokenVerifyResponse(
        valid=result["valid"],
        payload=result.get("payload"),
        message=result["message"]
    )


class DriverLoginRequest(BaseModel):
    id: str
    password: str


@router.post(
    "/driver/login",
    status_code=status.HTTP_200_OK,
    summary="Ambulance Driver In-Cab Login",
    description="Authenticates an ambulance driver and returns active vehicle and session token."
)
def driver_login(req: DriverLoginRequest):
    auth_data = AuthService.authenticate_driver(req.id, req.password)
    if not auth_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Driver ID or Password."
        )
    return {
        "status": "success",
        "code": 100,
        "message": "Driver authenticated",
        "profile": auth_data["profile"],
        "token": auth_data["token"]
    }


class HospitalRegisterRequest(BaseModel):
    name: str
    license_id: Optional[str] = None
    zone: Optional[str] = "Central Jaipur"
    email: Optional[str] = None
    phone: Optional[str] = None
    bays: Optional[str] = "12"
    password: Optional[str] = "Jaipur@2026"
    key: Optional[str] = None


@router.post(
    "/register-hospital",
    status_code=status.HTTP_200_OK,
    summary="Register New Hospital Facility",
    description="Registers a new healthcare facility in the Fox network."
)
def register_hospital(req: HospitalRegisterRequest):
    return AuthService.register_hospital(req.dict())

