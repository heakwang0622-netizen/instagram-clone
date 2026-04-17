# 데이터베이스 설계 명세서 (SQLite · Instagram 클론)

## 1. 개요

- **엔진**: SQLite 3
- **ORM**: SQLAlchemy 2.0 스타일 권장
- **원칙**: 정수 기본키 `id`, 타임스탬프 `created_at` / `updated_at`(필요 시), 외래키 `ON DELETE` 정책 명시

## 2. ER 개요

```
users ──┬──< posts
        ├──< comments
        ├──< likes (post)
        ├──< saved_posts >── posts
        ├──< follows (follower → followee)
        ├──< notifications
        ├──< conversation_participants >── conversations
        │                                    └──< messages
        └── (self-referential for follows)
```

## 3. 테이블 정의

### 3.1 `users`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | |
| username | TEXT | UNIQUE, NOT NULL, INDEX | 로그인·URL 식별자 |
| email | TEXT | UNIQUE, NOT NULL | |
| password_hash | TEXT | NOT NULL | |
| full_name | TEXT | | 표시 이름 |
| bio | TEXT | | |
| avatar_url | TEXT | | 미디어 경로 또는 URL |
| is_private | BOOLEAN | NOT NULL, DEFAULT 0 | 비공개 계정 |
| is_active | BOOLEAN | NOT NULL, DEFAULT 1 | |
| created_at | DATETIME | NOT NULL | |

**인덱스**: `username`, `email`

### 3.2 `posts`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK | |
| user_id | INTEGER | FK → users.id, NOT NULL, ON DELETE CASCADE | |
| caption | TEXT | | |
| location | TEXT | | 선택 |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | | |

**인덱스**: `(user_id, created_at DESC)` — 프로필 그리드·피드

### 3.3 `post_media`

다중 이미지(캐러셀) 지원.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK | |
| post_id | INTEGER | FK → posts.id, ON DELETE CASCADE | |
| media_url | TEXT | NOT NULL | 저장 경로 |
| media_type | TEXT | NOT NULL, DEFAULT `image` | `image` 또는 `video` (프론트 업로드·`<video>` 렌더링과 대응) |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | 표시 순서 |

**인덱스**: `(post_id, sort_order)`

### 3.4 `comments`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK | |
| post_id | INTEGER | FK → posts.id, ON DELETE CASCADE | |
| user_id | INTEGER | FK → users.id, ON DELETE CASCADE | |
| text | TEXT | NOT NULL | |
| created_at | DATETIME | NOT NULL | |

**인덱스**: `(post_id, created_at)`

### 3.5 `likes`

사용자·게시물 유일.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK | |
| user_id | INTEGER | FK → users.id, ON DELETE CASCADE | |
| post_id | INTEGER | FK → posts.id, ON DELETE CASCADE | |
| created_at | DATETIME | NOT NULL | |

**UNIQUE**: `(user_id, post_id)`  
**인덱스**: `post_id`(좋아요 수 집계)

### 3.6 `follows`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK | |
| follower_id | INTEGER | FK → users.id, ON DELETE CASCADE | 팔로우하는 사람 |
| followee_id | INTEGER | FK → users.id, ON DELETE CASCADE | 팔로우 당하는 사람 |
| created_at | DATETIME | NOT NULL | |

**UNIQUE**: `(follower_id, followee_id)`  
**CHECK**: `follower_id != followee_id`  
**인덱스**: `follower_id`, `followee_id`

### 3.7 `conversations`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK | |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | | 마지막 메시지 기준 갱신 권장 |

### 3.8 `conversation_participants`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| conversation_id | INTEGER | FK → conversations.id, ON DELETE CASCADE | |
| user_id | INTEGER | FK → users.id, ON DELETE CASCADE | |

**PK**: `(conversation_id, user_id)`  
1:1 DM은 참가자 2명으로 애플리케이션에서 보장.

### 3.9 `messages`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK | |
| conversation_id | INTEGER | FK → conversations.id, ON DELETE CASCADE | |
| sender_id | INTEGER | FK → users.id, ON DELETE CASCADE | |
| body | TEXT | NOT NULL | |
| read_at | DATETIME | NULL | 읽음 |
| created_at | DATETIME | NOT NULL | |

**인덱스**: `(conversation_id, created_at DESC)`

### 3.10 `notifications`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK | |
| user_id | INTEGER | FK → users.id, ON DELETE CASCADE | 수신자 |
| actor_id | INTEGER | FK → users.id, ON DELETE SET NULL | 행동 주체 |
| type | TEXT | NOT NULL | `like`, `comment`, `follow`, `mention` 등 |
| post_id | INTEGER | FK → posts.id, ON DELETE CASCADE, NULL | 해당 시 |
| comment_id | INTEGER | FK → comments.id, ON DELETE SET NULL, NULL | 해당 시(댓글 삭제 후 알림 행은 유지·참조만 해제) |
| is_read | BOOLEAN | NOT NULL, DEFAULT 0 | |
| created_at | DATETIME | NOT NULL | |

**인덱스**: `(user_id, is_read, created_at DESC)`

### 3.11 `saved_posts`

프론트 **저장됨**(`/saved`) 화면용. 사용자·게시물 저장 관계.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| user_id | INTEGER | FK → users.id, ON DELETE CASCADE | 저장한 사용자 |
| post_id | INTEGER | FK → posts.id, ON DELETE CASCADE | 저장된 게시물 |
| created_at | DATETIME | NOT NULL | 저장 시각 |

**PK**: `(user_id, post_id)` 또는 별도 `id` + **UNIQUE** `(user_id, post_id)`  
**인덱스**: `user_id`, `post_id`

## 4. 파생 데이터(캐시 컬럼, 선택)

성능 최적화를 위해 `users`에 아래를 비정규화할 수 있다(트랜잭션에서 일관 유지).

- `posts_count`, `followers_count`, `following_count`

초기에는 `COUNT` 쿼리로 구현하고, 부하 시 캐시 컬럼 도입.

## 5. 마이그레이션

- Alembic으로 초기 스키마 및 이후 변경 버전 관리
- SQLite 제약: 컬럼 변경 시 테이블 재생성 패턴 주의

## 6. 샘플 제약 요약

- 좋아요·팔로우·대화 참가자 조합 중복 방지: UNIQUE
- 게시물·댓글 삭제 시 연쇄 삭제: `ON DELETE CASCADE`로 고아 레코드 방지

---

*API 필드 매핑은 `backend.md`의 Pydantic 스키마와 일치시킨다.*
