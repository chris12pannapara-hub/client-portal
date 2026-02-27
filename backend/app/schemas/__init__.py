"""
Pydantic schemas for request/response validation.

Schemas define the shape of data going in and out of the API.
They are NOT database models — they're data transfer objects (DTOs).
"""

from app.schemas.auth import *
from app.schemas.user import *
from app.schemas.notification import *