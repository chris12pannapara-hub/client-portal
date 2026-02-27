"""
Core configuration using Pydantic Settings.

All environment variables are validated and type-checked at startup.
This prevents runtime errors from misconfigured env vars.
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, validator
from pydantic import field_validator, AnyHttpUrl


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    Pydantic automatically:
    - Loads from .env file
    - Validates types (str, int, bool, etc.)
    - Raises clear errors if required vars are missing
    """
    
    # Application
    APP_NAME: str = "Client Portal"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: PostgresDsn
    
    # Security
    SECRET_KEY: str  # Must be set in .env — no default for security
    ALGORITHM: str = "HS256"
    
    # JWT expiry
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Account security
    MAX_FAILED_LOGIN_ATTEMPTS: int = 5
    ACCOUNT_LOCKOUT_DURATION_MINUTES: int = 15
    
    # CORS — comma-separated list of allowed origins
    CORS_ORIGINS: List[AnyHttpUrl]
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"  # Ignore unknown env vars
    )
    
    @field_validator("CORS_ORIGINS", mode="before")
    def parse_cors_origins(cls, v: str):
        """Convert comma-separated string to list of origins."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v or []
    
    @validator("SECRET_KEY")
    def validate_secret_key(cls, v: str) -> str:
        """Ensure SECRET_KEY is long enough."""
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        return v


# Singleton instance — import this throughout the app
settings = Settings()