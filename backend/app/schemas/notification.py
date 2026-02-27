"""
Pydantic schemas for notification endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class NotificationResponse(BaseModel):
    """Notification data returned by the API."""
    id: UUID
    user_id: UUID
    title: str
    message: str
    type: str  # 'info' | 'success' | 'warning' | 'alert'
    is_read: bool
    read_at: Optional[datetime]
    action_url: Optional[str]
    metadata: Dict[str, Any]
    created_at: datetime
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "c1000000-0000-0000-0000-000000000001",
                "user_id": "a3000000-0000-0000-0000-000000000003",
                "title": "New Login Detected",
                "message": "A new login was detected from Toronto, ON.",
                "type": "alert",
                "is_read": False,
                "read_at": None,
                "action_url": "/profile/sessions",
                "metadata": {"ip": "192.168.1.100"},
                "created_at": "2026-02-18T10:20:00Z"
            }
        }


class NotificationListResponse(BaseModel):
    """Response containing a list of notifications."""
    notifications: list[NotificationResponse]
    total: int
    unread_count: int


class MarkAsReadRequest(BaseModel):
    """Request body for marking notification(s) as read."""
    notification_ids: list[UUID] = Field(..., min_items=1)