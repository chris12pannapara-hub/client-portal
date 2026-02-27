"""
Security utilities: password hashing, JWT token generation/verification.

This module centralizes all cryptographic operations.
Never implement crypto yourself — always use battle-tested libraries.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings


# Passlib context for bcrypt password hashing
# Cost factor 12 = ~250ms per hash on modern hardware (slow by design)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a plain-text password using bcrypt.
    
    Returns a string like: $2b$12$<22-char-salt><31-char-hash>
    The salt is embedded in the output — no separate storage needed.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against a bcrypt hash.
    
    Returns True if they match, False otherwise.
    Timing-safe comparison — always takes the same time regardless of result.
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Payload to encode (usually {"sub": user_id, "role": role})
        expires_delta: Custom expiry duration (default from settings)
    
    Returns:
        Encoded JWT string (3 parts separated by dots: header.payload.signature)
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({"exp": expire, "type": "access"})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT refresh token.
    
    Refresh tokens are longer-lived than access tokens and are also
    stored in the database (sessions table) for revocation capability.
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    
    to_encode.update({"exp": expire, "type": "refresh"})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify a JWT token.
    
    Returns:
        Dict containing the token payload if valid, None if invalid/expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def get_token_subject(token: str) -> Optional[str]:
    """
    Extract the 'sub' (subject) claim from a token.
    
    In our system, 'sub' contains the user_id UUID.
    Returns None if token is invalid or missing 'sub'.
    """
    payload = decode_token(token)
    if payload:
        return payload.get("sub")
    return None