"""
API router aggregator.

Combines all route modules under a single /api/v1 prefix.
"""

from fastapi import APIRouter

from app.api.v1 import auth, users, notifications

# Create main API router
api_router = APIRouter(prefix="/api/v1")

# Include all route modules
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(notifications.router)