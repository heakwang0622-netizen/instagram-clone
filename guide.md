# Kwangsta 클론 프로젝트 가이드

> 최종 업데이트: 2026-04-21

## 1. 프로젝트 개요

React(프론트) + FastAPI(백엔드) + SQLite 기반 Kwangsta 클론.  
인증, 피드, 게시물 CRUD, 프로필, 팔로우, 댓글, 좋아요, DM, 알림, 관리자 패널을 구현.

| 문서 | 내용 |
|------|------|
| [front.md](./front.md) | 화면·컴포넌트·API 연동 현황 |
| [backend.md](./backend.md) | FastAPI 구조·엔드포인트 현황 |
| [db.md](./db.md) | DB 테이블·관계·인덱스 현황 |
| [guide.md](./guide.md) | 설치·실행 가이드 (이 파일) |

## 2. 저장소 구조

```
kwangsta.it.com/          # 프로젝트 루트
  package.json            # 루트 원클릭 스크립트 (concurrently)
  start.bat               # Windows 더블클릭 실행
  frontend/               # React + Vite (TypeScript)
    src/
    vite.config.ts
    package.json
  backend/                # FastAPI (Python 3.11+)
    app/
    alembic/
    instagram.db          # SQLite DB 파일
    uploads/              # 업로드 파일 저장 (.gitignore)
    .env                  # 환경 변수 (.gitignore)
    .env.example
  front.md
  backend.md
  db.md
  guide.md
```

## 3. 개발 환경 요구사항

- Node.js LTS 이상
- Python 3.11 이상
- Git

## 4. 최초 설치 및 실행 (원클릭)

프로젝트 **루트**에서 한 번에 설치 + 기동:

```bash
npm run dev
```

동작 순서:
1. 루트 `node_modules` 설치 (concurrently)
2. `backend/` Python 의존성 설치 (`pip install -r requirements.txt`)
3. `frontend/` npm 의존성 설치
4. Alembic 마이그레이션 + 시드 데이터 적용 (`run_dev_prep.py`)
5. 백엔드 서버 기동: `http://127.0.0.1:8000`
6. Vite 개발 서버 기동: `http://localhost:5173` (브라우저 자동 열림)

> `npm start`는 `npm run dev`와 동일합니다.  
> Windows에서는 `start.bat`을 더블클릭해도 동일하게 동작합니다.

## 5. 개별 실행

```bash
# 백엔드만
npm run dev:backend          # 8000 포트, hot-reload 없음
npm run dev:backend:reload   # --reload 옵션 포함

# 프론트만
npm run dev:frontend         # Vite 5173 포트

# 직접 uvicorn
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# Vite만 (프록시 없이 직접 실행)
cd frontend
npm run dev:vite
```

## 6. 환경 변수 설정

### 백엔드 (`backend/.env`)

```env
DATABASE_URL=sqlite:///./instagram.db
SECRET_KEY=your-secret-key-change-in-production
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
UPLOAD_DIR=uploads
```

참고 파일: `backend/.env.example`

### 프론트엔드 (`frontend/.env`)

```env
# 생략 시 Vite 프록시 사용 (개발 기본값)
VITE_API_BASE_URL=
```

> `VITE_API_BASE_URL`을 비워두면 Vite가 `/api`, `/media` 요청을 `http://127.0.0.1:8000`으로 프록시합니다.  
> 직접 백엔드를 지정하려면 `VITE_API_BASE_URL=http://127.0.0.1:8000`으로 설정합니다.

## 7. DB 마이그레이션

```bash
# 최신 마이그레이션 적용
cd backend
alembic upgrade head

# 현재 버전 확인
alembic current

# 새 마이그레이션 생성
alembic revision --autogenerate -m "설명"
```

Alembic은 `run_dev_prep.py`에서 서버 기동 전 자동 실행됩니다.

## 8. 관리자 계정 설정

DB에서 직접 `is_admin=1`로 설정:

```bash
cd backend
python -c "
from app.database import SessionLocal
from app.models.user import User
db = SessionLocal()
u = db.query(User).filter(User.email=='your@email.com').first()
u.is_admin = True
db.commit()
print('완료')
db.close()
"
```

관리자로 로그인하면 `/admin` 대시보드로 자동 이동합니다.

## 9. API 문서

백엔드 실행 후 접속:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- 헬스 체크: `http://localhost:8000/api/v1/health`

## 10. 주요 npm 스크립트 목록

| 스크립트 | 설명 |
|----------|------|
| `npm run dev` | 전체 설치 + 백엔드 + 프론트 동시 기동 |
| `npm start` | `npm run dev`와 동일 |
| `npm run dev:backend` | 백엔드만 기동 |
| `npm run dev:backend:reload` | 백엔드 hot-reload 기동 |
| `npm run dev:frontend` | 프론트만 기동 |
| `npm run install:all` | 전체 의존성 설치만 |
| `npm run install:backend` | Python 의존성만 설치 |
| `npm run install:frontend` | npm 의존성만 설치 |
| `npm run free:port` | 8000 포트 강제 해제 |

## 11. 보안 체크리스트

- `SECRET_KEY`는 반드시 환경 변수로만 관리 (기본값 사용 금지)
- `uploads/` 디렉터리는 gitignore 대상
- `instagram.db`는 서버 외부 노출 금지
- 프로덕션: HTTPS 적용, CORS 오리진 최소화

## 12. 배포 참고

```bash
# 백엔드 (프로덕션)
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 프론트엔드 빌드
cd frontend
npm run build
# dist/ 를 Nginx 등 정적 호스팅으로 서빙
```

- SQLite는 단일 서버에 적합. 다중 인스턴스 필요 시 PostgreSQL 이전 검토.
- `UPLOAD_DIR` 경로를 영구 디스크에 마운트해 배포 간 업로드 파일 보존.

---

문서 간 불일치가 있을 경우 **사용자 경험과 보안**을 우선하고, 변경 시 네 파일을 함께 갱신한다.
