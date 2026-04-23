# 백엔드 현황 문서 (FastAPI · Kwangsta 클론)

> 최종 업데이트: 2026-04-21

## 1. 기술 스택 (실제 구현)

| 항목 | 내용 |
|------|------|
| 언어 | Python 3.11+ |
| 프레임워크 | FastAPI (version `"인스타그램 클론 API" v0.2.0`) |
| DB | SQLite (`instagram.db`) — WAL 모드, 외래키 활성화 |
| ORM | SQLAlchemy 2.x (Mapped/mapped_column 스타일) |
| 마이그레이션 | Alembic (4개 버전 적용 완료) |
| 인증 | JWT(Access) — `python-jose[cryptography]`, Bearer 헤더 |
| 비밀번호 | bcrypt (`passlib`) |
| 검증 | Pydantic v2 (`pydantic-settings`) |
| 파일 서빙 | `uploads/` 디렉터리 → `/media` 정적 마운트 |

## 2. 프로젝트 구조

```
backend/
  app/
    main.py          # FastAPI 앱, CORS, 라우터 등록, /media 마운트
    config.py        # pydantic-settings 환경 변수
    database.py      # SQLAlchemy 엔진, 세션, Base
    dependencies.py  # get_current_user, get_optional_user, get_admin_user
    models/          # ORM 모델 (user, post, comment, like, follow,
                     #           conversation, notification, saved_post)
    schemas/         # Pydantic 스키마 (auth, common 등)
    api/v1/
      auth.py        # 인증 (로그인·회원가입)
      users.py       # 사용자 프로필·팔로우·저장
      posts.py       # 게시물 CRUD·피드·탐색
      comments.py    # 댓글
      search.py      # 사용자 검색
      conversations.py  # DM
      notifications.py  # 알림
      admin.py       # 관리자 전용
    utils/           # token 유틸
  alembic/
    versions/
      a469b8d28f3e_initial_schema.py
      c1a4d0f2e9a1_add_users_is_admin.py
      d2e5f8a1b4c0_add_users_website.py
      f7a2b91c4d3e_add_post_media_media_type.py
  uploads/           # 업로드 파일 저장 경로
  instagram.db       # SQLite DB 파일
  .env               # 환경 변수 (gitignore)
  .env.example       # 환경 변수 예시
```

## 3. 환경 변수 (`.env`)

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `DATABASE_URL` | `sqlite:///./instagram.db` | DB 파일 경로 |
| `SECRET_KEY` | `change-me-in-production` | JWT 서명 키 |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | 허용 오리진(쉼표 구분) |
| `UPLOAD_DIR` | `uploads` | 업로드 루트 경로 |

## 4. CORS 설정

- `CORS_ORIGINS` 환경 변수 목록 + 정규식 `https?://(localhost|127\.0\.0\.1)(:\d+)?$`으로 localhost 임의 포트 허용
- `allow_credentials=False` (토큰은 Bearer 헤더 사용)

## 5. API 엔드포인트 전체 목록

모든 경로는 `/api/v1` 접두사 적용.

### 5.1 인증 (`/api/v1/auth`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/auth/register` | 회원가입 → `{ access_token, token_type, user }` |
| POST | `/auth/login` | 로그인 → `{ access_token, token_type, user }` |

### 5.2 사용자 (`/api/v1/users`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/users/me` | 내 프로필 (통계 포함) |
| PATCH | `/users/me` | 프로필 수정 (full_name, bio, avatar_url, website) |
| PATCH | `/users/me/password` | 비밀번호 변경 |
| GET | `/users/me/saved` | 저장된 게시물 목록 |
| GET | `/users/suggested` | 팔로우 추천 사용자 |
| GET | `/users/{username}` | 공개 프로필 (is_following 포함) |
| GET | `/users/{username}/followers` | 팔로워 목록 |
| GET | `/users/{username}/following` | 팔로잉 목록 |
| GET | `/users/{username}/posts` | 프로필 그리드 게시물 |
| POST | `/users/{user_id}/follow` | 팔로우 |
| DELETE | `/users/{user_id}/follow` | 언팔로우 |

### 5.3 게시물 (`/api/v1/posts`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/posts/feed` | 홈 피드 (팔로우 기반, cursor 페이징) |
| GET | `/posts/explore` | 탐색 그리드 (선택: `?media_type=image\|video`) |
| POST | `/posts` | 게시물 작성 (`multipart/form-data`) |
| GET | `/posts/{post_id}` | 단일 게시물 (liked_by_me, saved_by_me, media[] 포함) |
| PATCH | `/posts/{post_id}` | 캡션·위치 수정 (작성자만) |
| DELETE | `/posts/{post_id}` | 삭제 (작성자만, CASCADE) |
| POST | `/posts/{post_id}/like` | 좋아요 |
| DELETE | `/posts/{post_id}/like` | 좋아요 취소 |
| POST | `/posts/{post_id}/save` | 저장 |
| DELETE | `/posts/{post_id}/save` | 저장 취소 |

### 5.4 댓글 (`/api/v1/`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/posts/{post_id}/comments` | 댓글 목록 |
| POST | `/posts/{post_id}/comments` | 댓글 작성 |
| DELETE | `/comments/{comment_id}` | 댓글 삭제 (작성자 또는 게시물 작성자) |

### 5.5 검색 (`/api/v1/search`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/search/users?q=` | 유저네임·이름 검색 |

### 5.6 DM (`/api/v1/conversations`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/conversations` | 내 대화 목록 |
| POST | `/conversations` | 대화 생성 또는 기존 반환 (`{ user_id }`) |
| GET | `/conversations/{id}/messages` | 메시지 목록 |
| POST | `/conversations/{id}/messages` | 메시지 전송 (`{ body }`) |
| POST | `/conversations/{id}/read` | 읽음 처리 |

### 5.7 알림 (`/api/v1/notifications`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/notifications` | 알림 목록 |
| POST | `/notifications/{id}/read` | 단건 읽음 |
| POST | `/notifications/read-all` | 전체 읽음 |

### 5.8 관리자 (`/api/v1/admin`)

`is_admin=true` JWT만 접근 가능.

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/admin/stats` | 전체 통계 (users/posts/comments/likes 수, 오늘 가입·게시) |
| GET | `/admin/users?q=&limit=&offset=` | 회원 목록·검색 |
| DELETE | `/admin/users/{user_id}` | 회원 삭제 (본인 관리자 제외) |
| GET | `/admin/posts?q=&limit=&offset=` | 게시물 목록·검색 |
| DELETE | `/admin/posts/{post_id}` | 게시물 강제 삭제 |

### 5.9 헬스

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/health` | 인프라용 헬스 체크 |
| GET | `/api/v1/health` | 프론트 `fetchHealth()` 사용 |

### 5.10 미디어

| 경로 | 설명 |
|------|------|
| `GET /media/{filename}` | `uploads/` 디렉터리 정적 서빙 |

## 6. 인증 흐름

```
클라이언트                    서버
  ──POST /auth/login──────────▶  users 테이블 조회, bcrypt 검증
  ◀──{ access_token, user }───   JWT 발급 (sub=user.id)

  ──GET /users/me─────────────▶  Authorization: Bearer <token>
                                  dependencies.get_current_user()
                                  jwt.decode → User 조회
  ◀──{ profile + stats }──────
```

- 토큰 알고리즘: HS256 (`app/utils/token.py`)
- `get_optional_user`: 미인증 시 None 반환 (공개 엔드포인트용)
- `get_admin_user`: `is_admin=False`면 403

## 7. Alembic 마이그레이션 이력

| 버전 ID | 내용 |
|---------|------|
| `a469b8d28f3e` | 초기 스키마 (전체 테이블) |
| `c1a4d0f2e9a1` | `users.is_admin` 컬럼 추가 |
| `d2e5f8a1b4c0` | `users.website` 컬럼 추가 |
| `f7a2b91c4d3e` | `post_media.media_type` 컬럼 추가 |

## 8. 실행 (개발)

```bash
# 루트에서 원클릭 (백엔드 + 프론트 동시 기동)
npm run dev

# 백엔드만 단독 실행
npm run dev:backend         # 자동 재시작 없음
npm run dev:backend:reload  # --reload 옵션

# 직접 uvicorn
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## 9. 비기능

- **OpenAPI 문서**: `http://localhost:8000/docs` (Swagger UI), `/redoc`
- **SQLite WAL 모드**: `PRAGMA journal_mode=WAL` (동시성 향상)
- **외래키 강제**: `PRAGMA foreign_keys=ON`
- **업로드 MIME**: 최소 `image/jpeg`, `image/png`, `image/webp`, `video/mp4`

---

*스키마 세부는 `db.md`, 프론트 연동은 `front.md`, 실행 방법은 `guide.md` 참조.*
