"""
Database session management.

Creates the SQLAlchemy engine and provides a session factory.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import settings

# Create database engine
# pool_pre_ping=True ensures stale connections are recycled
engine = create_engine(
    str(settings.DATABASE_URL),
    pool_pre_ping=True,
    echo=settings.DEBUG  # Log all SQL queries in debug mode
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency that provides a database session.
    
    FastAPI will automatically:
    1. Create a new session when a request starts
    2. Yield it to the route handler
    3. Close it when the request finishes (even if an exception occurs)
    
    Usage in route:
        @router.get("/example")
        def example_route(db: Session = Depends(get_db)):
            # Use db here
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()