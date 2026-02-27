"""
Notification API routes.

Endpoints:
- GET   /notifications        - List user's notifications
- PATCH /notifications/read   - Mark notification(s) as read
- GET   /notifications/unread/count - Get unread notification count
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.schemas.notification import NotificationListResponse, NotificationResponse, MarkAsReadRequest
from app.models.user import User
from app.models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationListResponse, status_code=status.HTTP_200_OK)
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    unread_only: bool = Query(False)
):
    """
    Get notifications for the authenticated user.
    
    **Query Parameters:**
    - limit: Max number of notifications to return (default 20, max 100)
    - offset: Pagination offset (default 0)
    - unread_only: If true, return only unread notifications
    
    **Returns:**
    - List of notifications
    - Total count
    - Unread count
    """
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    # Get total and unread counts
    total = query.count()
    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    
    # Fetch paginated results
    notifications = query.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()
    
    return NotificationListResponse(
        notifications=notifications,
        total=total,
        unread_count=unread_count
    )


@router.get("/unread/count", status_code=status.HTTP_200_OK)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the count of unread notifications.
    
    **Returns:**
    - unread_count: Number of unread notifications
    
    This endpoint is polled by the frontend notification bell every 30 seconds.
    """
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    
    return {"unread_count": count}


@router.patch("/read", status_code=status.HTTP_200_OK)
def mark_notifications_as_read(
    mark_data: MarkAsReadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark one or more notifications as read.
    
    **Request Body:**
    - notification_ids: Array of notification UUIDs to mark as read
    
    **Returns:**
    - Success message with count of updated notifications
    
    **Errors:**
    - 404: One or more notification IDs not found or don't belong to user
    """
    # Fetch notifications
    notifications = db.query(Notification).filter(
        Notification.id.in_(mark_data.notification_ids),
        Notification.user_id == current_user.id
    ).all()
    
    # Check if all requested notifications exist
    if len(notifications) != len(mark_data.notification_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more notifications not found"
        )
    
    # Mark as read (trigger will auto-set read_at)
    updated_count = 0
    for notification in notifications:
        if not notification.is_read:
            notification.is_read = True
            updated_count += 1
    
    db.commit()
    
    return {
        "message": f"Marked {updated_count} notification(s) as read",
        "updated_count": updated_count
    }