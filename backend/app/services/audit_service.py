"""
Audit service — creates immutable audit log entries.
"""

from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.audit_log import AuditLog


def log_audit_event(
    db: Session,
    action: str,
    outcome: str = "success",
    user_id: Optional[UUID] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> AuditLog:
    """
    Create an audit log entry.
    
    This function is called throughout the application whenever a
    security-relevant event occurs.
    
    Args:
        db: Database session
        action: Event type (e.g., 'login_success', 'password_change')
        outcome: 'success' | 'failure' | 'error'
        user_id: User who performed the action (nullable for pre-auth events)
        ip_address: Client IP address
        user_agent: Client user agent string
        metadata: Event-specific extra data
    
    Returns:
        The created AuditLog entry
    """
    audit_entry = AuditLog(
        user_id=user_id,
        action=action,
        outcome=outcome,
        ip_address=ip_address,
        user_agent=user_agent,
        metadata=metadata or {}
    )
    
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    
    return audit_entry