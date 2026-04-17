# 백엔드 개발 명세서 (FastAPI · Instagram 클론)

본 문서는 **현재 프론트엔드에 구현된 화면·동작**에 맞춰 API와 데이터베이스 범위를 한정한다. 설계에 없는 기능은 구현하지 않으며, 필요 시 이후 버전에서 확장한다.

---

## 1. 목표와 범위

### 1.1 기술 스택

| 항목 | 선택 |
|------|------|
| 언어 | Python 3.11+ |
| 프레임워크 | FastAPI |
| DB | **SQLite만 사용** (개발·스테이징·프로덕션 동일 엔진) |
| ORM | SQLAlchemy 2.x |
| 마이그레이션 | Alembic 권장 |
| 인증 | JWT(Access) 단일, `Authorization: Bearer` |
| 비밀번호 | bcrypt |
| 검증 | Pydantic v2 |
| 파일 | 로컬 디렉터리 `uploads/` + 정적 경로로 서빙 |

**SQLite 운영**

- **개발**: 예) `sqlite:///./instagram.db` 또는 프로젝트 루트의 `instagram.db`
- **프로덕션**: 동일 SQLite 파일을 서버 디스크 고정 경로에 두고, `DATABASE_URL` 환경 변수로만 경로를 바꾼다. (별도 PostgreSQL/MySQL 도입은 본 명세 범위 아님.)

### 1.2 프론트와 연동되는 기능 (구현 대상)

| 영역 | 화면/동작 | 백엔드 필요 여부 |
|------|-----------|------------------|
| 인증 | 로그인(JSON), 회원가입(프론트는 로컬 처리 → API로 이전 가능) | **로그인 필수**, 회원가입 API 권장 |
| 사용자 | 프로필, 프로필 편집(이름·소개), 팔로워/팔로잉 목록 | **필수** |
| 게시물 | 피드, 탐색 그리드, 게시 상세, 작성(이미지/동영상), 좋아요 | **필수** |
| 댓글 | 게시 상세·피드에서 댓글 표시/작성 | **필수** |
| 검색 | 사용자 검색 | **필수** |
| 저장 | 저장됨 그리드 | **필수** (`saved_posts` 테이블) |
| DM | 대화 목록, 스레드, 메시지 전송 | **필수** |
| 알림 | 알림 목록 | **필수** |
| 설정 | 비밀번호 변경(메뉴), 로그아웃(클라이언트) | 비밀번호 **API 권장**, 로그아웃은 선택 |
| 관리자 | 통계 대시보드, 회원 관리(가입일/탈퇴), 게시물 관리(삭제) | **필수(관리자 전용)** |

### 1.3 명시적 비범위 (프론트 데모·정적 UI)

아래는 **전용 API·테이블을 1차에서 만들지 않는다.** (목업 데이터 또는 기존 리소스로 대체 가능.)

| 항목 | 이유 |
|------|------|
| 페이스북/소셜 로그인 | 프론트에서 제거됨 |
| 스토리 24h 업로드 | 상단 스토리 행은 프로필 링크 수준; 별도 스토리 테이블 **미구현** |
| 릴스 전용 피드 API | 화면은 일반 게시물·동영상으로 대체 가능; 필요 시 `posts`에 `media_type` 구분으로 확장 |
| 북마크 **콜렉션** 다중 폴더 | UI는 데모 데이터; **저장됨(단일 목록)** API만 맞추면 됨 |
| 설정의 도움말·정보 페이지 | 정적 문구, 서버 불필요 |
| Refresh 토큰·서버 세션 블랙리스트 | JWT 만료만으로 단순화 가능 |
| WebSocket 실시간 DM | 폴링 또는 REST만으로 1차 구현 |

---

## 2. 환경 변수

| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | 예: `sqlite:///./instagram.db` (프로덕션은 절대 경로 파일 URL) |
| `SECRET_KEY` | JWT 서명 |
| `CORS_ORIGINS` | 프론트 오리진(쉼표 구분). 개발: `http://localhost:5173` 등 |
| `UPLOAD_DIR` | 업로드 루트 경로 (기본 `uploads`) |

---

## 3. 데이터베이스 (SQLite)

상세 컬럼은 `db.md`와 일치시키되, **프론트 저장됨**을 위해 아래를 반드시 포함한다.

### 3.1 필수 테이블

- `users` — 계정
- `posts`, `post_media` — 게시물·캐러셀 (`post_media`에 **`media_type`** `image`/`video` 포함 — 작성 화면의 이미지·동영상 업로드와 동일 계약)
- `comments` — 댓글
- `likes` — 게시물 좋아요
- `follows` — 팔로우 관계
- **`saved_posts`** — 사용자별 저장 게시물 (복합 PK `(user_id, post_id)`로 중복 방지, `UNIQUE(user_id, post_id)`와 동등)
- `conversations`, `conversation_participants`, `messages` — DM (`conversations.updated_at`으로 목록 정렬 시 활용 가능)
- `notifications` — 알림 (`comment_id`는 댓글 삭제 시 `ON DELETE SET NULL`)

### 3.2 파생 카운트

`users.posts_count`, `followers_count`, `following_count`는 **초기에는 집계 쿼리**로 충분하며, 부하 시에만 캐시 컬럼 도입.

### 3.3 프론트엔드 타입과의 대응 (DB 관점)

| 프론트 (`src/types`) | DB / 비고 |
|----------------------|-----------|
| `User.id` (문자열, 목업) | API·DB는 정수 PK; 응답 직렬화 시 문자열 변환 가능 |
| `Post.media[]` / `PostMedia.url` | `post_media.media_url` |
| 동영상 게시 (`CreatePostPage`) | `post_media.media_type = 'video'` |
| `AppNotification.postId`, `comment` 연계 | `notifications.post_id`, `comment_id` |
| `Conversation.lastAt` | `messages` 집계 또는 `conversations.updated_at` 유지 |

### 3.4 `db.md`와의 관계

- 스키마 상세·인덱스·`ON DELETE` 정책은 **`db.md`를 기준**으로 한다. Alembic 마이그레이션은 이 명세와 일치하도록 유지한다.

---

## 4. API 설계 원칙

- Prefix: `/api/v1` (아래 표의 경로는 이 접두사를 생략해 적음)
- 에러: 401 인증, 403 권한, **404 리소스 없음**, 422 검증 실패
- 목록: `{ "items": [...], "next_cursor": null }` 형태 권장 (간단하면 `items`만)
- 미디어 URL: 업로드 후 `GET /media/{filename}` 또는 앱 설정의 `BASE_URL` + 경로
- **프론트 연동 현황**: `src/lib/api.ts`는 `GET /api/v1/health`, `auth-api.ts`는 `POST /api/v1/auth/login`만 호출한다. 나머지 화면은 목업이며, 아래 명세는 연동 시 계약·DB 정합성 기준이다.

---

## 5. 엔드포인트 명세 (프론트·DB 정합 기준)

### 5.1 인증

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/auth/register` | JSON: `email`, `password`, `username`, `full_name`(선택) → **로그인과 동일 형태** `{ access_token, token_type: "bearer", user }` 권장(201). `users` 행 생성. |
| POST | `/auth/login` | JSON: `email`, `password` → `{ access_token, token_type: "bearer", user }` (**프론트 `auth-api.ts`와 동일 계약**) |

**응답 `user` 필드(공통)**: `id`(정수·PK), `username`, `email`, `full_name`, `avatar_url`, `bio` — 모두 `users` 테이블 매핑. 회원가입 직후에도 로그인과 같은 스키마를 쓰면 프론트 `mapApiUserToUser` 재사용이 가능하다.

### 5.2 현재 사용자

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/users/me` | JWT 기준 프로필. `posts_count`, `followers_count`, `following_count`는 **집계**(§3.2). 로그인 직후 목업에 없는 통계를 채울 때 사용. |
| PATCH | `/users/me` | JSON: `full_name`, `bio`, `avatar_url` 등(프론트 프로필 편집·`PATCH`와 대응). `username`은 UI에서 비활성이면 서버에서도 변경 금지 가능. |
| PATCH | `/users/me/password` | JSON: `current_password`, `new_password`(설정 `/settings/password` 연동용). `users.password_hash` 갱신. |

### 5.3 공개 프로필·팔로우

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/users/{username}` | 공개 프로필 + 통계. 선택 필드 **`is_following`**(로그인 시): `follows`에서 `(follower_id=나, followee_id=프로필)` 존재 여부. |
| GET | `/users/{username}/followers` | 팔로워 목록(각 항목은 사용자 요약). `follows.followee_id = 프로필` |
| GET | `/users/{username}/following` | 팔로잉 목록. `follows.follower_id = 프로필` |
| GET | `/users/suggested` | 쿼리: `limit`(기본 5). 홈 피드 사이드 **「회원님을 위한 추천」**용. 자기 자신 제외, 이미 팔로우한 사용자 제외; `users` + `follows`로 필터. |
| POST | `/users/{user_id}/follow` | 팔로우. `follows` 행 삽입(UNIQUE 위반 시 idempotent 200 처리 가능). |
| DELETE | `/users/{user_id}/follow` | 언팔로우. `follows` 행 삭제. |

### 5.4 게시물

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/posts/feed` | 홈 피드. `follows`로 팔로한 사용자의 `posts` + (선택) 본인 글. 페이징 `cursor`. |
| GET | `/posts/explore` | 탐색 그리드. 쿼리 **`media_type`**=`image`\|`video` 선택 시 해당 타입을 포함한 게시물만(릴스 탭·`/reels`는 **별도 API 없이** 이 필터 또는 클라이언트 필터, §1.3과 일치). |
| POST | `/posts` | `multipart/form-data`: 파일들, `caption`, `location`(선택), 미디어별 `media_type`. `posts` + `post_media` 행 생성. |
| GET | `/posts/{post_id}` | 단일 게시물. `post_media`(url·**media_type**·sort_order), 작성자, `likes_count`, `comments_count`, 로그인 시 **`liked_by_me`**, **`saved_by_me`**(`saved_posts` 존재 여부). |
| PATCH | `/posts/{post_id}` | 캡션·위치 수정(작성자). `posts.caption`, `posts.location`, `posts.updated_at`. |
| DELETE | `/posts/{post_id}` | 삭제(작성자). CASCADE로 `post_media`, `comments`, `likes`, `saved_posts` 연쇄 삭제. |
| GET | `/users/{username}/posts` | 프로필 그리드. `posts` WHERE `user_id` 매칭. |

**프론트 참고**: 게시 상세(`/p/:postId`)·피드 카드는 캐러셀·동영상을 위해 응답에 `media[]`와 `media_type`이 필요하다. 탐색(`/explore`) 상단 검색창은 UI만 있고, 서버 필터가 없으면 동일 `GET /posts/explore`로 충분하다.

### 5.5 댓글·좋아요

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/posts/{post_id}/comments` | 댓글 목록. `comments` + 작성자 요약. |
| POST | `/posts/{post_id}/comments` | JSON `text`. `comments` 행. |
| DELETE | `/comments/{comment_id}` | 삭제(작성자 또는 게시물 작성자). |
| POST | `/posts/{post_id}/like` | 좋아요. `likes` UNIQUE `(user_id, post_id)`. |
| DELETE | `/posts/{post_id}/like` | 좋아요 취소. |

### 5.6 검색

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/search/users?q=` | `users.username`, `full_name` 검색(대소문자 정책은 구현 선택). `/search` 페이지 목록. |

### 5.7 저장됨 (화면 `/saved`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/users/me/saved` | `saved_posts` 조인 `posts`·미디어. 탭 「릴스」「장소」는 UI 비활성(§1.3). |
| POST | `/posts/{post_id}/save` | 저장. `saved_posts` 삽입. |
| DELETE | `/posts/{post_id}/save` | 저장 취소. |

### 5.8 DM

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/conversations` | 내 참가 대화. `conversation_participants` + 상대 `User`, 마지막 메시지·시간(`messages` 또는 `conversations.updated_at`). |
| GET | `/conversations/{id}/messages` | 메시지 목록. `messages` ORDER BY `created_at`. |
| POST | `/conversations` | JSON `user_id`(상대). 기존 1:1 스레드가 있으면 그 `conversations.id` 반환, 없으면 생성 + `conversation_participants` 2행. |
| POST | `/conversations/{id}/messages` | JSON `body`. `messages` 삽입, `conversations.updated_at` 갱신 권장. |
| POST | `/conversations/{id}/read` | **읽음 처리.** 상대가 보낸 메시지의 `messages.read_at` 설정(미읽음 카운트·UI용). DB 스키마와 필수 정합. |

### 5.9 알림

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/notifications` | `notifications` 수신자=나. `type`, `actor`, `post_id`, `comment_id`, `is_read`. |
| POST | `/notifications/{id}/read` | `is_read=true`. |
| POST | `/notifications/read-all` | 수신자 기준 전체 읽음. |

### 5.10 미디어

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/media/{filename}` | 업로드 파일 정적 서빙 (또는 Nginx 등). `post_media.media_url`이 이 경로를 가리킴. |

업로드 허용 MIME: 최소 `image/jpeg`, `image/png`, `image/webp`, 동영상은 `video/mp4` 등 프론트 `accept`와 맞출 것.

### 5.11 관리자(Admin)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/admin/stats` | 전체 회원/게시물/댓글/좋아요 및 오늘 가입/게시 통계 |
| GET | `/admin/users` | 회원 목록 + 가입일(`created_at`), 검색(`q`) |
| DELETE | `/admin/users/{user_id}` | 회원 탈퇴(계정 삭제). 본인 관리자 계정 삭제 금지 |
| GET | `/admin/posts` | 게시물 목록(작성자/캡션/반응수), 검색(`q`) |
| DELETE | `/admin/posts/{post_id}` | 게시물 강제 삭제 |

**권한**: 관리자 JWT(`users.is_admin = true`)만 접근 가능.

### 5.12 헬스

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/v1/health` | **프론트 `fetchHealth`가 사용.** API 생존 확인. |
| GET | `/health` | (선택) 리버스 프록시·컨테이너 헬스 전용. 프론트 코드에서는 호출하지 않음. |

### 5.13 엔드포인트 ↔ DB 매핑 (검증용)

| 영역 | 엔드포인트(§5) | 주요 테이블·파생 필드 |
|------|----------------|------------------------|
| 인증 | `/auth/register`, `/auth/login` | `users` |
| 내 프로필 | `/users/me` GET·PATCH, `/users/me/password` | `users`, 집계·`password_hash` |
| 프로필·팔로우 | `/users/{username}`, `.../followers`, `.../following`, `/users/suggested` | `users`, `follows` |
| 팔로우 변경 | `POST`·`DELETE` `/users/{id}/follow` | `follows` |
| 게시물 | `/posts/feed`, `explore`, `POST`, `GET`·`PATCH`·`DELETE` `{id}`, `/users/.../posts` | `posts`, `post_media`, `likes`(집계), `saved_posts`(표시 플래그) |
| 댓글·좋아요 | `/posts/{id}/comments`, `/comments/{id}`, like | `comments`, `likes` |
| 검색·저장 | `/search/users`, `/users/me/saved`, save | `users`, `saved_posts` |
| DM | `/conversations`, `.../messages`, `.../read` | `conversations`, `conversation_participants`, `messages`(`read_at`) |
| 알림 | `/notifications`, read | `notifications`(`actor_id`, `post_id`, `comment_id`, `is_read`) |
| 파일 | `GET /media/...` | 디스크; URL은 `post_media.media_url` 등에 저장 |

**제외(비범위와 일치)**: 북마크 **콜렉션** 전용 테이블·API 없음(`/bookmarks`). 스토리·릴스 **전용** 테이블 없음 — 릴스 UI는 `post_media.media_type` + §5.4 `explore` 쿼리로 충당.

---

## 6. 권장 프로젝트 구조

```
app/
  main.py
  config.py
  database.py
  dependencies.py       # get_current_user
  models/
  schemas/
  api/v1/
    auth.py
    users.py
    posts.py
    comments.py
    likes.py
    follows.py
    saved.py              # 또는 users 내부
    messages.py
    notifications.py
    search.py
  utils/                  # security, token
uploads/
```

---

## 7. 비기능

- **CORS**: `CORS_ORIGINS`에 프론트 주소 등록
- **OpenAPI**: `/docs`, `/redoc` 유지 (프론트·백 계약 기준)
- **Rate limiting**: 선택 (slowapi 등)

---

## 8. 테스트

- pytest + httpx `AsyncClient`
- 시나리오: 회원가입 → 로그인 → 게시물 작성 → 좋아요·댓글 → 저장 → 알림(트리거 시)

---

## 9. 배포 참고

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

- 프로덕션에서도 **SQLite 파일 경로**를 백업·권한 관리 대상으로 둔다.
- 동시 쓰기가 많아지면 WAL 모드 등 SQLite 튜닝을 검토한다.

---

## 10. 프론트 라우트 ↔ API (요약)

경로는 모두 `/api/v1` 접두사를 붙인다(§4).

| 프론트 경로 | 백엔드 |
|-------------|--------|
| `/login` | `POST /auth/login` |
| `/register` | `POST /auth/register`(응답은 로그인과 동형 권장) |
| `/` 피드 | `GET /posts/feed` + `cursor` 기반 무한 스크롤, 사이드바 추천 `GET /users/suggested` |
| `/explore` | `GET /posts/explore`(선택 쿼리 `media_type`) |
| `/reels` | 별도 릴스 API 없음 → `GET /posts/explore?media_type=video` 등(§1.3) |
| `/search` | `GET /search/users` |
| `/create` | `POST /posts`(multipart, `post_media.media_type`) |
| `/p/:postId` | `GET /posts/{id}`, 댓글·좋아요 §5.5 |
| `/:username` | `GET /users/{username}`(선택 `is_following`), `GET /users/{username}/posts` |
| 팔로워/팔로잉 | `GET /users/{username}/followers`, `/following` |
| `/saved` | `GET /users/me/saved`, `POST`·`DELETE /posts/{id}/save` |
| `/direct`, `/direct/:id` | §5.8(목록·메시지·생성·**`POST .../read`**) |
| `/notifications` | §5.9 |
| `/accounts/edit` | `PATCH /users/me` |
| `/settings/password` | `PATCH /users/me/password` |

**정적·데모만**: `/bookmarks` 콜렉션 UI, `/settings/help`, `/about`, 스토리 전용 API. **릴스 전용 REST 리소스는 두지 않음**(탐색·`media_type`으로 대체).

---

*스키마 세부는 `db.md`를 따르며, Alembic 초기 스키마·후속 마이그레이션과 동기화한다.*

---

## 11. 데이터베이스 검토 요약 (2026-04)

- **ORM**: `Comment` 모델의 `Notification` 관계가 중복 선언되어 있던 부분을 제거해 SQLAlchemy 매핑을 정리함.
- **스키마**: 프론트 게시 작성(이미지·동영상)과 맞추기 위해 `post_media.media_type` 컬럼(`image`/`video`, 기본 `image`)을 추가함 (`db.md` §3.3, Alembic `f7a2b91c4d3e`).
- **문서**: `saved_posts` 표기 통일, `notifications.comment_id`의 `ON DELETE SET NULL`을 `db.md`에 명시.

---

## 12. API 명세 검증 요약 (프론트·스키마 대조)

- **분석 범위**: `App.tsx` 라우트, `types/index.ts`, 목업·페이지 컴포넌트, 실제 `fetch`는 `auth-api.ts`·`api.ts`만 사용.
- **추가·보강**
  - **`GET /users/suggested`**: 피드 `FeedPage` 사이드 「회원님을 위한 추천」에 대응(`users`·`follows`).
  - **`POST /conversations/{id}/read`**: `messages.read_at` 컬럼과 DM 미읽음 UI 정합.
  - **`GET /posts/explore?media_type=`**: `/reels` 단일 릴스 API 없이 `post_media.media_type`과 맞춤(§1.3).
  - **회원가입 응답**: `/register`는 아직 로컬 목업이나, 연동 시 로그인과 동일 JSON 권장(§5.1).
  - **단일 게시물 응답**: `liked_by_me`, `saved_by_me`, `media[].media_type` — `likes`·`saved_posts`·`post_media`와 직접 대응.
  - **프로필 `is_following`**: `follows` 조회로 제공(컬럼 비정규화 불필요).
- **축소·정리**
  - **`GET /health`**: 인프라용으로만 유지, **프론트는 `GET /api/v1/health`만 사용**(§5.11).
  - **릴스 전용 CRUD**: 명세에서 제외(탐색·게시물으로 통합).
- **오류 코드 문구 수정**: §4에서 리소스 없음을 **404**로 명시(기존 “404 없음”은 오해 소지가 있어 정정).
