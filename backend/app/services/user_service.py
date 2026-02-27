"""
User service — business logic for user profile management.
"""

from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.core.security import verify_password, hash_password
from app.services.audit_service import log_audit_event


class UserService:
    """Handles user profile operations."""
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
        """Fetch a user by their UUID."""
        from uuid import UUID
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            return None
        
        return db.query(User).filter(User.id == user_uuid).first()
    
    @staticmethod
    def update_user_profile(
        db: Session,
        user: User,
        update_data: Dict[str, Any],
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> User:
        """
        Update user profile fields.
        
        Only updates fields present in update_data.
        """
        allowed_fields = {"first_name", "last_name", "preferences"}
        
        for field, value in update_data.items():
            if field in allowed_fields and value is not None:
                setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        
        # Log profile update
        log_audit_event(
            db=db,
            user_id=user.id,
            action="profile_updated",
            outcome="success",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"updated_fields": list(update_data.keys())}
        )
        
        return user
    
    @staticmethod
    def change_password(
        db: Session,
        user: User,
        current_password: str,
        new_password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> None:
        """
        Change user's password.
        
        Verifies current password before updating.
        """
        # Verify current password
        if not verify_password(current_password, user.password_hash):
            log_audit_event(
                db=db,
                user_id=user.id,
                action="password_change",
                outcome="failure",
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"reason": "invalid_current_password"}
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Update password
        user.password_hash = hash_password(new_password)
        db.commit()
        
        # Log successful password change
        log_audit_event(
            db=db,
            user_id=user.id,
            action="password_change",
            outcome="success",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={}
        )