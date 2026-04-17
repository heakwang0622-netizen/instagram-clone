# 인스타그램 클론 API (FastAPI)

`backend.md` 명세에 맞춘 REST API입니다. SQLite + Alembic 마이그레이션, JWT 인증, `uploads/` 미디어 서빙(`/media/...`)을 포함합니다.

## 설정

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy .env.example .env   # 필요 시 SECRET_KEY 등
```

## 실행

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Swagger: http://127.0.0.1:8000/docs  
- 헬스: http://127.0.0.1:8000/api/v1/health  
- 업로드 파일: http://127.0.0.1:8000/media/{파일명}

기동 시 Alembic `upgrade head` 후 데모 시드가 실행됩니다.

## 테스트 계정 (시드)

| 항목 | 값 |
|------|-----|
| 이메일 | `test@gmail.com` |
| 비밀번호 | `12345` |
| 사용자 이름 | `testuser` |

시드에 샘플 게시물(외부 `picsum.photos` 이미지 URL)이 포함됩니다. 스키마를 바꾼 뒤 오류가 나면 `backend/instagram.db`를 삭제하고 서버를 다시 켜세요.

## 주요 라우트 (접두사 `/api/v1`)

| 영역 | 경로 예 |
|------|---------|
| 인증 | `POST /auth/register`, `POST /auth/login` |
| 사용자 | `GET/PATCH /users/me`, `GET /users/suggested`, `GET /users/{username}`, 팔로우·팔로워 목록 |
| 게시물 | `GET /posts/feed`, `GET /posts/explore`, `POST /posts`(multipart), CRUD, 댓글·좋아요·저장 |
| 검색 | `GET /search/users` |
| DM | `GET/POST /conversations`, 메시지, `POST .../read` |
| 알림 | `GET /notifications`, 읽음 처리 |

자세한 계약은 루트의 `backend.md`를 참고하세요.

## API 스모크 테스트

1. 위 **실행**으로 서버를 띄운 뒤, 다른 터미널에서:

```bash
python scripts/test_api.py
```

기본 URL은 `http://127.0.0.1:8000` 입니다. 변경 시 환경 변수 `API_BASE_URL`을 설정합니다.

2. pytest (선택):

```bash
pip install pytest
set API_BASE_URL=http://127.0.0.1:8000
pytest tests/test_smoke.py -q
```

OneDrive 등 동기화 폴더에서는 `.pytest_cache` 쓰기 권한 경고가 날 수 있습니다. 프로젝트를 로컬 디스크에 두거나 관리자 권한이 필요할 수 있습니다.
