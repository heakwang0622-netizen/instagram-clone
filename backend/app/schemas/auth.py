"""호환용 — 스키마는 `app.schemas.common`을 사용합니다."""

from app.schemas.common import LoginBody, LoginResponse, RegisterBody, UserOut

__all__ = ["LoginBody", "LoginResponse", "RegisterBody", "UserOut"]
