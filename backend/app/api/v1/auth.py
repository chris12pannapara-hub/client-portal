"""
Authentication API routes.

Endpoints:
- POST /auth/login       - Authenticate user and return tokens
- POST /auth/logout      - Revoke refresh token(s)
- POST /auth/refresh     - Get new access token using refresh token
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.schemas.auth import LoginRequest, RefreshTokenRequest, TokenResponse, LogoutResponse
from app.services.auth_service import AuthService
from app.models.user import User
from app.core.config import settings
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login(
    request: Request,
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate a user and return access + refresh tokens.
    
    **Request Body:**
    - email_or_username: User's email or username
    - password: User's password
    
    **Returns:**
    - access_token: Short-lived JWT (15 min)
    - refresh_token: Long-lived JWT (7 days)
    - token_type: "bearer"
    - expires_in: Seconds until access_token expires
    
    **Errors:**
    - 401: Invalid credentials
    - 403: Account locked or deactivated
    """
    # Extract client info from request
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    # Authenticate user
    user, access_token, refresh_token = AuthService.authenticate_user(
        db=db,
        email_or_username=login_data.email_or_username,
        password=login_data.password,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert to seconds
    )


@router.post("/refresh", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def refresh_token(
    request: Request,
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Issue a new access token using a valid refresh token.
    
    **Request Body:**
    - refresh_token: The refresh token received during login
    
    **Returns:**
    - New access_token and refresh_token pair
    
    **Errors:**
    - 401: Invalid or expired refresh token
    """
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    new_access_token, new_refresh_token = AuthService.refresh_access_token(
        db=db,
        refresh_token=refresh_data.refresh_token,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/logout", response_model=LogoutResponse, status_code=status.HTTP_200_OK)
def logout(
    request: Request,
    refresh_data: RefreshTokenRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logout the current user.
    
    **Optional Request Body:**
    - refresh_token: If provided, only this session is revoked
    - If omitted, ALL sessions for this user are revoked (logout from all devices)
    
    **Returns:**
    - Confirmation message with timestamp
    """
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    refresh_token = refresh_data.refresh_token if refresh_data else None