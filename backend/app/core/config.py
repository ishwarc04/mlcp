from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CedarStone Bank API"
    environment: str = "development"
    database_url: str = "sqlite:///./cedarstone.db"
    secret_key: str = "local-development-secret-change-me"
    access_token_expire_minutes: int = 480
    model_dir: Path = Path("models")
    cors_origins: str = "http://localhost:5173,http://localhost:4173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

