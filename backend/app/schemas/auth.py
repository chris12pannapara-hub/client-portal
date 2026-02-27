"""
Pydantic schemas for authentication endpoints.

Request schemas: what the client sends
Response schemas: what the API returns
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# =============================================================================
# REQUEST SCHEMAS
# =============================================================================

class LoginRequest(BaseModel):
    """
    Login request body.
    
    Accepts either email OR username (both are unique identifiers).
    """
    email_or_username: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    
    class Config:
        json_schema_extra = {
            "example": {
                "email_or_username": "chris@portal.dev",
                "password": "Chris@123!"
            }
        }


class RefreshTokenRequest(BaseModel):
    """Request body for token refresh."""
    refresh_token: str = Field(..., min_length=10)


# =============================================================================
# RESPONSE SCHEMAS
# =============================================================================

class TokenResponse(BaseModel):
    """
    Response after successful login or token refresh.
    
    The client stores access_token in memory (NOT localStorage).
    The refresh_token is httpOnly cookie-stored (handled by middleware).
    """
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds until access_token expires
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 900
            }
        }


class LogoutResponse(BaseModel):
    """Response after successful logout."""
    message: str = "Logged out successfully"
    logged_out_at: datetime