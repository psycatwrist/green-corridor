"""
Security Module for Fox Backend
Handles JWT token generation, verification, and keypass hashing/validation.
"""
import hashlib
import hmac
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
import jwt

from app.config import JWT_SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRATION_MINUTES


def hash_keypass(keypass: str) -> str:
    """
    Computes SHA-256 hash of a keypass string.
    This ensures sensitive passwords/keypasses are not stored in raw plaintext.
    """
    return hashlib.sha256(keypass.encode("utf-8")).hexdigest()


def verify_keypass(plain_or_incoming_keypass: str, stored_hash_or_keypass: str) -> bool:
    """
    Verifies the incoming keypass against the stored value.
    Supports:
    1. Incoming plaintext compared to stored SHA-256 hash.
    2. Incoming pre-hashed SHA-256 compared to stored SHA-256 hash.
    3. Fallback direct timing-safe comparison.
    """
    incoming_bytes = plain_or_incoming_keypass.strip().encode("utf-8")
    stored_bytes = stored_hash_or_keypass.strip().encode("utf-8")

    # If direct comparison matches
    if hmac.compare_digest(incoming_bytes, stored_bytes):
        return True

    # Check if hashing incoming matches the stored hash
    hashed_incoming = hashlib.sha256(incoming_bytes).hexdigest().encode("utf-8")
    if hmac.compare_digest(hashed_incoming, stored_bytes):
        return True

    return False


def create_jwt_token(payload: Dict[str, Any], expires_minutes: int = JWT_EXPIRATION_MINUTES) -> str:
    """
    Generates a signed JSON Web Token (JWT).
    JWT contains:
    - sub: subject (identifier/key)
    - role: 'hospital' or 'traffic_admin'
    - iat: issued-at timestamp
    - exp: expiration timestamp
    - custom claims (e.g., hospital_key, admin_name)
    """
    to_encode = payload.copy()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=expires_minutes)

    to_encode.update({
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp())
    })

    # Signs payload using the secret key and HS256 algorithm
    token = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token


def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and validates a JWT token.
    Returns the decoded payload dict if valid, or None if expired/tampered.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except (jwt.PyJWTError, Exception):
        return None
