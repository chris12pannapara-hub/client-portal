"""
SQLAlchemy ORM models.

Import all models here so Alembic auto-generates migrations correctly.
IMPORTANT: Import order matters to avoid circular dependencies.
"""

from app.db.base import Base

# Import models in dependency order (tables with no foreign keys first)
from app.models.user import User
from app.models.session import SessionModel
from app.models.notification import Notification
from app.models.audit_log import AuditLog

__all__ = ["Base", "User", "SessionModel", "Notification", "AuditLog"]