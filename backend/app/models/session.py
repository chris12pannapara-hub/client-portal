"""
Session ORM model.

Maps to the 'sessions' table in PostgreSQL.
Tracks refresh tokens for each user.
"""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.base import Base


class SessionModel(Base):
    """
    User session model.
    
    Stores refresh tokens and tracks device/IP information.
    """
    
    __tablename__ = "sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Refresh token (stored as-is for now — consider hashing in production)
    refresh_token = Column(Text, unique=True, nullable=False, index=True)
    
    # Device context
    ip_address = Column(INET)
    user_agent = Column(Text)
    device_type = Column(String(50))  # 'desktop' | 'mobile' | 'tablet'
    
    # Token lifecycle
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    is_revoked = Column(Boolean, nullable=False, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    last_used_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="sessions", foreign_keys=[user_id])
    
    def __repr__(self) -> str:
        return f"<SessionModel {self.id} for user {self.user_id}>"
    
    @property
    def is_expired(self) -> bool:
        """Check if the session token has expired."""
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_valid(self) -> bool:
        """Check if the session is still usable."""
        return not self.is_revoked and not self.is_expired