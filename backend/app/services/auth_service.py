"""
Authentication service — business logic for login, logout, token refresh.
"""

from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.models.session import SessionModel
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.core.config import settings
from app.services.audit_service import log_audit_event


class AuthService:
    """Handles all authentication operations."""
    
    @staticmethod
    def authenticate_user(
        db: Session,
        email_or_username: str,
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Tuple[User, str, str]:
        """
        Authenticate a user and create a new session.
        
        Returns:
            Tuple of (user, access_token, refresh_token)
        
        Raises:
            HTTPException if authentication fails
        """
        # Find user by email or username
        user = db.query(User).filter(
            (User.email == email_or_username) | (User.username == email_or_username)
        ).first()
        
        # If user doesn't exist, log failed attempt and raise 401
        if not user:
            log_audit_event(
                db=db,
                user_id=None,
                action="login_failure",
                outcome="failure",
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"email_or_username": email_or_username, "reason": "user_not_found"}
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Check if account is deactivated
        if not user.is_active:
            log_audit_event(
                db=db,
                user_id=user.id,
                action="login_failure",
                outcome="failure",
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"email": user.email, "reason": "account_deactivated"}
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account has been deactivated"
            )
        
        # Check if account is locked
        if user.is_locked:
            log_audit_event(
                db=db,
                user_id=user.id,
                action="login_failure",
                outcome="failure",
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"email": user.email, "reason": "account_locked"}
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is temporarily locked due to failed login attempts"
            )
        
        # Verify password
        if not verify_password(password, user.password_hash):
            # Increment failed login attempts
            user.failed_login_attempts += 1
            
            # Lock account if max attempts reached
            if user.failed_login_attempts >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
                user.locked_until = datetime.utcnow() + timedelta(
                    minutes=settings.ACCOUNT_LOCKOUT_DURATION_MINUTES
                )
                db.commit()
                
                log_audit_event(
                    db=db,
                    user_id=user.id,
                    action="account_locked",
                    outcome="success",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata={
                        "email": user.email,
                        "attempts": user.failed_login_attempts,
                        "locked_until": user.locked_until.isoformat()
                    }
                )
                
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account locked due to too many failed login attempts"
                )
            
            db.commit()
            
            log_audit_event(
                db=db,
                user_id=user.id,
                action="login_failure",
                outcome="failure",
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={
                    "email": user.email,
                    "reason": "invalid_password",
                    "attempt": user.failed_login_attempts
                }
            )
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Successful authentication — reset failed attempts
        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login_at = datetime.utcnow()
        db.commit()
        
        # Generate tokens
        access_token = create_access_token(
            data={"sub": str(user.id), "role": user.role}
        )
        refresh_token = create_refresh_token(
            data={"sub": str(user.id)}
        )
        
        # Store refresh token in sessions table
        session = SessionModel(
            user_id=user.id,
            refresh_token=refresh_token,
            ip_address=ip_address,
            user_agent=user_agent,
            device_type=AuthService._detect_device_type(user_agent),
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        db.add(session)
        db.commit()
        
        # Log successful login
        log_audit_event(
            db=db,
            user_id=user.id,
            action="login_success",
            outcome="success",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"email": user.email, "session_id": str(session.id)}
        )
        
        return user, access_token, refresh_token
    
    @staticmethod
    def refresh_access_token(
        db: Session,
        refresh_token: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Tuple[str, str]:
        """
        Issue a new access token using a valid refresh token.
        
        Returns:
            Tuple of (new_access_token, new_refresh_token)
        """
        # Find session by refresh token
        session = db.query(SessionModel).filter(
            SessionModel.refresh_token == refresh_token
        ).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Check if session is valid
        if not session.is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired or been revoked"
            )
        
        # Get user
        user = session.user
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Generate new tokens
        new_access_token = create_access_token(
            data={"sub": str(user.id), "role": user.role}
        )
        new_refresh_token = create_refresh_token(
            data={"sub": str(user.id)}
        )
        
        # Revoke old refresh token (single-use)
        session.is_revoked = True
        
        # Create new session with new refresh token
        new_session = SessionModel(
            user_id=user.id,
            refresh_token=new_refresh_token,
            ip_address=ip_address or session.ip_address,
            user_agent=user_agent or session.user_agent,
            device_type=session.device_type,
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        db.add(new_session)
        db.commit()
        
        # Log token refresh
        log_audit_event(
            db=db,
            user_id=user.id,
            action="token_refresh",
            outcome="success",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"session_id": str(new_session.id)}
        )
        
        return new_access_token, new_refresh_token
    
    @staticmethod
    def logout_user(
        db: Session,
        user: User,
        refresh_token: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> None:
        """
        Logout a user by revoking their refresh token(s).
        
        If refresh_token is provided, only that session is revoked.
        Otherwise, all active sessions for the user are revoked.
        """
        if refresh_token:
            # Revoke specific session
            session = db.query(SessionModel).filter(
                SessionModel.user_id == user.id,
                SessionModel.refresh_token == refresh_token
            ).first()
            
            if session:
                session.is_revoked = True
        else:
            # Revoke all sessions (logout from all devices)
            db.query(SessionModel).filter(
                SessionModel.user_id == user.id,
                SessionModel.is_revoked == False
            ).update({"is_revoked": True})
        
        db.commit()
        
        # Log logout
        log_audit_event(
            db=db,
            user_id=user.id,
            action="logout",
            outcome="success",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"logout_type": "single" if refresh_token else "all_devices"}
        )
    
    @staticmethod
    def _detect_device_type(user_agent: Optional[str]) -> str:
        """Detect device type from user agent string."""
        if not user_agent:
            return "unknown"
        
        user_agent_lower = user_agent.lower()
        
        if any(mobile in user_agent_lower for mobile in ["mobile", "android", "iphone"]):
            return "mobile"
        elif "tablet" in user_agent_lower or "ipad" in user_agent_lower:
            return "tablet"
        else:
            return "desktop"