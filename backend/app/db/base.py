"""
SQLAlchemy declarative base.

All ORM models inherit from this Base class.
This must be imported before any models are defined.
"""

from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()