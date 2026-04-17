# Instagram 클론 프로젝트 가이드

## 1. 프로젝트 목표

React 프론트엔드와 FastAPI 백엔드, SQLite를 사용해 **인증, 피드, 게시물, 프로필, 팔로우, 댓글, 좋아요, DM, 알림**을 포함한 Instagram 수준의 클론 웹앱을 구현한다. 문서는 다음 네 파일로 구성된다.

| 문서 | 내용 |
|------|------|
| [front.md](./front.md) | 화면, 컴포넌트, 상태, API 연동 규칙 |
| [backend.md](./backend.md) | FastAPI 구조, 엔드포인트, 보안 |
| [db.md](./db.md) | 테이블·관계·인덱스 |

## 2. 저장소 구조(권장 모노레포)

```
My_instagram/
  package.json       # 루트 원클릭 실행 (concurrently)
  start.bat          # Windows 더블클릭 실행
  frontend/          # React (Vite)
  backend/           # FastAPI
  uploads/           # 로컬 미디어 (gitignore)
  front.md
  backend.md
  db.md
  guide.md
```

## 3. 개발 환경

### 3.1 공통

- Git, Node.js LTS, Python 3.11+
- IDE: VS Code / Cursor + ESLint, Ruff(또는 Black), Prettier

### 3.2 백엔드

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install fastapi uvicorn[standard] sqlalchemy alembic python-jose[cryptography] passlib[bcrypt] python-multipart
```

- `.env` 예: `DATABASE_URL=sqlite:///./instagram.db`, `SECRET_KEY=...`, `CORS_ORIGINS=http://localhost:5173`

### 3.3 프론트엔드

```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install react-router-dom @tanstack/react-query
```

- `.env`: `VITE_API_BASE_URL=http://localhost:8000`

## 4. 실행 순서 (원클릭)

**한 번에 설치 + 백엔드 + 프론트 + 브라우저 열기**

프로젝트 **루트**(`My_instagram/`) 또는 **`frontend/`** 폴더에서:

```bash
npm run dev
```

(`frontend`에서 실행해도 백엔드·프론트가 함께 뜹니다. Vite만 쓰려면 `cd frontend` 후 `npm run dev:vite`.)

Windows에서는 `start.bat`을 더블클릭해도 동일합니다.

동작 요약: 루트·백엔드·프론트 의존성 설치(이미 있으면 빠르게 통과) → API(`http://127.0.0.1:8000`)와 Vite(`http://127.0.0.1:5173`) 동시 기동 → 기본 브라우저가 프론트 주소로 자동 열림. (`npm start`는 `npm run dev`와 동일합니다.)

**개별 실행**이 필요할 때만:

1. 백엔드: `cd backend` 후 `python -m uvicorn app.main:app --reload`
2. 프론트: `cd frontend` 후 `npm run dev`

## 5. 계약(Contract) 원칙

- **단일 진실**: OpenAPI(`http://localhost:8000/docs`)와 프론트 TypeScript 타입을 맞춘다.
- **에러 형식**: HTTP 상태 + FastAPI 기본 `detail` 또는 통일된 `{ "code", "message" }`(팀 합의 후 고정).
- **페이지네이션**: cursor + limit; 응답에 `next_cursor` 유무 명시.
- **시간**: ISO 8601 UTC 문자열 권장.

## 6. 구현 우선순위(MVP → 확장)

1. **MVP**: 회원가입/로그인, 프로필, 팔로우, 게시물 CRUD(단일 이미지), 피드, 좋아요, 댓글, 검색
2. **2단계**: 다중 이미지(캐러셀), 탐색 그리드, 알림
3. **3단계**: DM(폴링 → WebSocket), 비공개 계정 요청(선택), 릴스/스토리(선택)

## 7. 보안 체크리스트

- 비밀번호 해시, JWT 시크릿은 환경 변수만 사용
- 업로드: 확장자·MIME·용량 제한, 경로 순회 방지
- SQL: ORM 파라미터 바인딩만 사용
- 프로덕션: HTTPS, `Secure` 쿠키, CORS 최소화

## 8. 배포 개요(참고)

- 프론트: 정적 호스팅(Vercel, Netlify, S3+CloudFront)
- 백엔드: 단일 VM 또는 PaaS(Render, Fly.io); SQLite는 단일 인스턴스에 적합(동시 다중 노드 시 PostgreSQL 등 이전 검토)

## 9. 다음 단계

1. `backend/`에 FastAPI 스캐폴딩 및 Alembic 초기 마이그레이션(`db.md` 반영)
2. `frontend/`에 라우트·레이아웃·인증 플로우 스캐폴딩(`front.md` 화면 목록)
3. 사용자 스토리별 E2E 시나리오 정리 후 API부터 구현

---

문서 간 불일치가 있으면 **사용자 경험과 보안**을 우선하고, 변경 시 네 파일을 함께 갱신한다.
