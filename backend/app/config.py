from urllib.parse import quote_plus

from pydantic import AliasChoices, Field, computed_field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # development → SQLite, production/staging → PostgreSQL (DATABASE_URL 미지정 시)
    app_env: str = Field(
        default="development",
        validation_alias=AliasChoices("APP_ENV", "ENVIRONMENT"),
    )

    database_url_override: str | None = Field(default=None, validation_alias="DATABASE_URL")

    sqlite_url: str = Field(default="sqlite:///./instagram.db", validation_alias="SQLITE_URL")

    postgres_user: str = Field(default="postgres", validation_alias="POSTGRES_USER")
    postgres_password: str = Field(default="", validation_alias="POSTGRES_PASSWORD")
    postgres_host: str = Field(default="localhost", validation_alias="POSTGRES_HOST")
    postgres_port: int = Field(default=5432, validation_alias="POSTGRES_PORT")
    postgres_db: str = Field(default="instagram", validation_alias="POSTGRES_DB")

    secret_key: str = "change-me-in-production"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    upload_dir: str = "uploads"

    @field_validator("database_url_override", mode="before")
    @classmethod
    def _empty_database_url_to_none(cls, v: object) -> str | None:
        if v is None or v == "":
            return None
        return str(v)

    @computed_field(repr=False)
    @property
    def database_url(self) -> str:
        if self.database_url_override is not None:
            return self.database_url_override
        env = self.app_env.strip().lower()
        if env in ("production", "prod", "staging"):
            return self._build_postgres_url()
        return self.sqlite_url

    def _build_postgres_url(self) -> str:
        user = quote_plus(self.postgres_user)
        if self.postgres_password:
            auth = f"{user}:{quote_plus(self.postgres_password)}"
        else:
            auth = user
        db = quote_plus(self.postgres_db)
        return (
            f"postgresql+psycopg://{auth}@{self.postgres_host}:{self.postgres_port}/{db}"
        )


settings = Settings()
