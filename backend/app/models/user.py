"""
User ORM model.

Maps to the 'users' table in PostgreSQL.
"""

from sqlalchemy import Column, String, Boolean, Integer, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.base import Base


class User(Base):
    """
    User account model.
    
    Relationships:
    - One user has many sessions (1:N)
    - One user has many notifications (1:N)
    - One user has many audit_log entries (1:N)
    """
    
    __tablename__ = "users"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Identity
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    
    # Profile
    first_name = Column(String(100))
    last_name = Column(String(100))
    
    # Authorization
    role = Column(String(50), nullable=False, default="user", index=True)
    
    # Account state
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    mfa_enabled = Column(Boolean, nullable=False, default=False)
    
    # Account lockout
    failed_login_attempts = Column(Integer, nullable=False, default=0)
    locked_until = Column(DateTime(timezone=True))
    
    # Preferences (stored as JSON)
    preferences = Column(JSON, default={})
    
    # Timestamps
    last_login_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships (using string references with full module path)
    sessions = relationship("SessionModel", back_populates="user", cascade="all, delete-orphan", foreign_keys="SessionModel.user_id")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan", foreign_keys="Notification.user_id")
    audit_logs = relationship("AuditLog", back_populates="user", foreign_keys="AuditLog.user_id")
    
    def __repr__(self) -> str:
        return f"<User {self.username} ({self.email})>"
    
    @property
    def full_name(self) -> str:
        """Returns the user's full name, or username if name is not set."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username
    
    @property
    def is_locked(self) -> bool:
        """Check if the account is currently locked."""
        if self.locked_until is None:
            return False
        return datetime.utcnow() < self.locked_until