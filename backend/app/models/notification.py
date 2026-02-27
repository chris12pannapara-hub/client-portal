"""
Notification ORM model.

Maps to the 'notifications' table in PostgreSQL.
"""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.base import Base


class Notification(Base):
    """
    In-app notification model.
    """
    
    __tablename__ = "notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Content
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Type drives UI rendering (icon, color)
    type = Column(String(50), nullable=False, default="info", index=True)
    
    # Read state
    is_read = Column(Boolean, nullable=False, default=False, index=True)
    read_at = Column(DateTime(timezone=True))
    
    # Optional navigation target
    action_url = Column(Text)
    
    # Flexible extra data
    # NOTE: 'metadata' is a reserved name in SQLAlchemy, so we use a different attribute name
    notification_metadata = Column("metadata", JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", back_populates="notifications")
    
    def __repr__(self) -> str:
        return f"<Notification {self.id}: {self.title}>"