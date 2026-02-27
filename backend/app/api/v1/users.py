"""
User API routes.

Endpoints:
- GET  /users/me           - Get current user's profile
- PATCH /users/me          - Update current user's profile
- POST /users/me/password  - Change current user's password
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.schemas.user import UserProfileResponse, UserUpdateRequest, PasswordChangeRequest
from app.services.user_service import UserService
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserProfileResponse, status_code=status.HTTP_200_OK)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Get the authenticated user's profile.
    
    **Returns:**
    - Full user profile including preferences and account status
    
    **Requires:**
    - Valid access token in Authorization header
    """
    return current_user


@router.patch("/me", response_model=UserProfileResponse, status_code=status.HTTP_200_OK)
def update_current_user_profile(
    request: Request,
    update_data: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update the authenticated user's profile.
    
    **Request Body:**
    - first_name: (optional) New first name
    - last_name: (optional) New last name
    - preferences: (optional) Updated preferences object
    
    **Returns:**
    - Updated user profile
    
    **Requires:**
    - Valid access token
    """
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    # Convert Pydantic model to dict, excluding unset fields
    update_dict = update_data.model_dump(exclude_unset=True)
    
    updated_user = UserService.update_user_profile(
        db=db,
        user=current_user,
        update_data=update_dict,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return updated_user


@router.post("/me/password", status_code=status.HTTP_200_OK)
def change_password(
    request: Request,
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change the authenticated user's password.
    
    **Request Body:**
    - current_password: User's current password (for verification)
    - new_password: New password (must meet complexity requirements)
    
    **Password Requirements:**
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
    
    **Returns:**
    - Success message
    
    **Errors:**
    - 400: Current password incorrect or new password doesn't meet requirements
    """
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    UserService.change_password(
        db=db,
        user=current_user,
        current_password=password_data.current_password,
        new_password=password_data.new_password,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return {"message": "Password changed successfully"}