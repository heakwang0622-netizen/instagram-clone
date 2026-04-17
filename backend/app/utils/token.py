from datetime import datetime, timedelta, timezone

from jose import jwt

from app.config import settings

ALGORITHM = "HS256"
ACCESS_DAYS = 7


def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "exp": now + timedelta(days=ACCESS_DAYS),
        "iat": now,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)
