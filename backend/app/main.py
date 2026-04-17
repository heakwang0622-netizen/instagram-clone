from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.auth import router as auth_router
from app.api.v1.admin import router as admin_router
from app.api.v1.comments import router as comments_router
from app.api.v1.conversations import router as conversations_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.posts import router as posts_router
from app.api.v1.search import router as search_router
from app.api.v1.users import router as users_router
from app.config import settings
import app.models  # noqa: F401 — 메타데이터에 전체 스키마 등록

app = FastAPI(title="인스타그램 클론 API", version="0.2.0")

_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
# Vite가 5173이 아닌 포트를 쓰거나, 직접 백엔드로 fetch할 때 프리플라이트가 막히지 않도록
# localhost / 127.0.0.1 + 임의 포트를 허용합니다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins if _origins else ["*"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

backend_root = Path(__file__).resolve().parent.parent
upload_dir = backend_root / settings.upload_dir
upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(upload_dir)), name="media")

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(admin_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(posts_router, prefix="/api/v1")
app.include_router(comments_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(conversations_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")

# 마이그레이션·시드는 서버 프로세스 밖에서 실행합니다 (`npm run dev:backend`).
# Windows + Python 3.14 등에서 기동 라이프사이클 안에서 DB/alembic을 돌릴 때
# uvicorn/asyncio와 충돌해 프로세스가 바로 종료되는 문제를 피합니다.


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "정상"}


@app.get("/api/v1/health")
def api_health() -> dict[str, str]:
    return {"status": "정상", "service": "인스타그램-클론"}
