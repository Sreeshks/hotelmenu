import os
import urllib.parse
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "Hotel Digital Menu API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "sqlite:///./hotel_menu.db"
    POSTGRES_USER: Optional[str] = None
    POSTGRES_PASSWORD: Optional[str] = None
    POSTGRES_HOST: Optional[str] = None
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: Optional[str] = None
    AUTO_SEED: bool = False


    def model_post_init(self, __context):
        if self.POSTGRES_USER and self.POSTGRES_PASSWORD and self.POSTGRES_DB:
            encoded_user = urllib.parse.quote_plus(self.POSTGRES_USER)
            encoded_pass = urllib.parse.quote_plus(self.POSTGRES_PASSWORD)
            host = self.POSTGRES_HOST or "postgres"
            self.DATABASE_URL = f"postgresql+psycopg://{encoded_user}:{encoded_pass}@{host}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


    # JWT Authentication
    JWT_SECRET_KEY: str = "change_me_super_secret_jwt_key_min_32_characters"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Frontend & CORS
    FRONTEND_URL: str = "https://menu.orcux.co.in"
    ALLOWED_ORIGINS: str = "https://menu.orcux.co.in,http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:5173"

    # File Uploads
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 15
    IMGBB_API_KEY: Optional[str] = "34b1022bc8d3afbe2dc9875cba76714d"
    UPLOAD_STORAGE_TYPE: str = "imgbb"

    # Anti-Spam / Rate Limiting
    REVIEW_RATE_LIMIT_PER_HOUR: int = 5
    REVIEW_COOLDOWN_SECONDS: int = 30
    AUTO_APPROVE_REVIEWS: bool = True

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
