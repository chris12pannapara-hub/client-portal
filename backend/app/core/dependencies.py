"""
FastAPI dependency injection functions.

These are reusable functions that FastAPI injects into route handlers.
Most importantly: authentication guards that verify JWT tokens.
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.core.security import decode_token
from app.models.user import User

# HTTPBearer extracts the token from the Authorization header
# Format: "Authorization: Bearer <token>"
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency that extracts and verifies the JWT access token.
    
    Returns the authenticated User object.
    Raises 401 if token is missing, invalid, or user doesn't exist.
    
    Usage:
        @router.get("/protected")
        def protected_route(current_user: User = Depends(get_current_user)):
            # current_user is guaranteed to be a valid User object
    """
    token = credentials.credentials
    
    # Decode the JWT
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Verify token type (must be 'access', not 'refresh')
    token_type = payload.get("type")
    if token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Extract user_id from the 'sub' claim
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    try:
        user_id = UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token"
        )
    
    # Fetch the user from the database
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Check if user account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated"
        )
    
    # Check if account is locked
    if user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is temporarily locked due to failed login attempts"
        )
    
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency that ensures the user is active.
    
    This is redundant with get_current_user (which already checks is_active),
    but kept for semantic clarity in routes that need to emphasize this requirement.
    """
    return current_user


def require_role(required_role: str):
    """
    Dependency factory for role-based access control.
    
    Usage:
        @router.get("/admin/users")
        def admin_only_route(
            current_user: User = Depends(require_role("admin"))
        ):
            # Only admins can reach here
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        role_hierarchy = {"user": 1, "manager": 2, "admin": 3}
        
        user_level = role_hierarchy.get(current_user.role, 0)
        required_level = role_hierarchy.get(required_role, 999)
        
        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. {required_role.capitalize()} role required."
            )
        
        return current_user
    
    return role_checker