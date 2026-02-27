"""
AuditLog ORM model.

Maps to the 'audit_log' table in PostgreSQL.
Immutable append-only record of security events.
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.base import Base


class AuditLog(Base):
    """
    Audit log model.
    
    CRITICAL: This table is append-only. Never UPDATE or DELETE rows.
    """
    
    __tablename__ = "audit_log"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Nullable: some events (failed login for unknown email) happen pre-auth
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True)
    
    # Event type
    action = Column(String(100), nullable=False, index=True)
    
    # Network context
    ip_address = Column(INET, index=True)
    user_agent = Column(String)
    
    # Outcome
    outcome = Column(String(20), nullable=False, default="success", index=True)
    
    # Event-specific payload
    metadata_: str | dict = Column("metadata", JSON, nullable=True)
    
    # Timestamp (no updated_at — this table is immutable)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    def __repr__(self) -> str:
        return f"<AuditLog {self.action} @ {self.created_at}>"