"""
Authentication Router
Handles login and token verification for Hospitals and Traffic Admins.
"""
from fastapi import APIRouter, status
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
