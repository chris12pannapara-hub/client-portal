"""
Pydantic schemas for user endpoints.
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


# =============================================================================
# RESPONSE SCHEMAS
# =============================================================================

class UserResponse(BaseModel):
    """
    Public user data returned by the API.
    
    NEVER include password_hash or other sensitive fields.
    """
    id: UUID
    email: EmailStr
    username: str
    first_name: Optional[str]
    last_name: Optional[str]
    role: str
    is_active: bool
    mfa_enabled: bool
    preferences: Dict[str, Any]
    last_login_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True  # Allows Pydantic v2 to work with SQLAlchemy models
        json_schema_extra = {
            "example": {
                "id": "a3000000-0000-0000-0000-000000000003",
                "email": "chris@portal.dev",
                "username": "chris_p",
                "first_name": "Chris",
                "last_name": "Pannapara",
                "role": "user",
                "is_active": True,
                "mfa_enabled": False,
                "preferences": {"theme": "light", "language": "en"},
                "last_login_at": "2026-02-18T10:30:00Z",
                "created_at": "2026-01-04T08:00:00Z"
            }
        }


class UserProfileResponse(UserResponse):
    """
    Extended user profile with additional details.
    
    Only returned for /users/me (the authenticated user's own profile).
    """
    failed_login_attempts: int
    locked_until: Optional[datetime]
    
    @property
    def is_locked(self) -> bool:
        """Check if account is currently locked."""
        if self.locked_until is None:
            return False
        return datetime.utcnow() < self.locked_until


# =============================================================================
# REQUEST SCHEMAS
# =============================================================================

class UserUpdateRequest(BaseModel):
    """
    Request body for updating user profile.
    
    All fields are optional — only send what you want to change.
    """
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    preferences: Optional[Dict[str, Any]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "first_name": "Christopher",
                "preferences": {"theme": "dark", "notifications": True}
            }
        }


class PasswordChangeRequest(BaseModel):
    """Request body for changing password."""
    current_password: str = Field(..., min_length=8, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)
    
    @validator("new_password")
    def validate_password_strength(cls, v):
        """
        Enforce password complexity rules.
        
        Requirements:
        - At least 8 characters
        - At least one uppercase letter
        - At least one lowercase letter
        - At least one digit
        - At least one special character
        """
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        
        special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        if not any(c in special_chars for c in v):
            raise ValueError("Password must contain at least one special character")
        
        return v