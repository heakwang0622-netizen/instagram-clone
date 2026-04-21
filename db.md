# 데이터베이스 현황 문서 (SQLite · Instagram 클론)

> 최종 업데이트: 2026-04-21

## 1. 개요

- **엔진**: SQLite 3 (`instagram.db`)
- **ORM**: SQLAlchemy 2.x (Mapped/mapped_column 스타일)
- **설정**: `PRAGMA foreign_keys=ON`, `PRAGMA journal_mode=WAL`
- **마이그레이션**: Alembic (4개 버전 누적 적용)

## 2. ER 개요

```
users ──┬──< posts >──< post_media
        ├──< comments
        ├──< likes (post)
        ├──< saved_posts >── posts
        ├──< follows (follower → followee, self-ref)
        ├──< notifications
        └──< conversation_participants >── conversations >──< messages
```

## 3. 테이블 정의 (실제 ORM 기준)

### 3.1 `users`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK, AUTOINCREMENT | |
| username | VARCHAR(30) | UNIQUE, NOT NULL, INDEX | 로그인·URL 식별자 |
| email | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 해시 |
| full_name | VARCHAR(100) | NULL | 표시 이름 |
| bio | TEXT | NULL | |
| website | VARCHAR(300) | NULL | 웹사이트 URL |
| avatar_url | VARCHAR(512) | NULL | 미디어 경로 또는 URL |
| is_private | BOOLEAN | NOT NULL, DEFAULT 0 | 비공개 계정 |
| is_active | BOOLEAN | NOT NULL, DEFAULT 1 | 계정 활성 여부 |
| is_admin | BOOLEAN | NOT NULL, DEFAULT 0 | 관리자 여부 |
| created_at | DATETIME | NOT NULL, server_default=now() | |

**인덱스**: `username`(unique), `email`(unique)

### 3.2 `posts`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK | |
| user_id | INTEGER | FK → users.id ON DELETE CASCADE, NOT NULL | |
| caption | TEXT | NULL | |
| location | VARCHAR(255) | NULL | |
| created_at | DATETIME | NOT NULL, server_default=now() | |
| updated_at | DATETIME | NULL | |

**인덱스**: `(user_id, created_at)` — 프로필 그리드·피드 쿼리

### 3.3 `post_media`

다중 이미지·동영상 캐러셀 지원.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK | |
| post_id | INTEGER | FK → posts.id ON DELETE CASCADE | |
| media_url | VARCHAR(1024) | NOT NULL | 저장 경로 |
| media_type | VARCHAR(16) | NOT NULL, DEFAULT `image` | `image` 또는 `video` |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | 표시 순서 |

**인덱스**: `(post_id, sort_order)`

### 3.4 `comments`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK | |
| post_id | INTEGER | FK → posts.id ON DELETE CASCADE, NOT NULL | |
| user_id | INTEGER | FK → users.id ON DELETE CASCADE, NOT NULL | |
| text | TEXT | NOT NULL | |
| created_at | DATETIME | NOT NULL, server_default=now() | |

**인덱스**: `(post_id, created_at)`

### 3.5 `likes`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK | |
| user_id | INTEGER | FK → users.id ON DELETE CASCADE, INDEX | |
| post_id | INTEGER | FK → posts.id ON DELETE CASCADE, INDEX | |
| created_at | DATETIME | NOT NULL, server_default=now() | |

**UNIQUE**: `(user_id, post_id)` — 중복 좋아요 방지

### 3.6 `follows`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK | |
| follower_id | INTEGER | FK → users.id ON DELETE CASCADE, INDEX | 팔로우하는 사람 |
| followee_id | INTEGER | FK → users.id ON DELETE CASCADE, INDEX | 팔로우 당하는 사람 |
| created_at | DATETIME | NOT NULL, server_default=now() | |

**UNIQUE**: `(follower_id, followee_id)` — `uq_follows_pair`  
**CHECK**: `follower_id != followee_id` — `ck_follows_not_self`

### 3.7 `conversations`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK | |
| created_at | DATETIME | NOT NULL, server_default=now() | |
| updated_at | DATETIME | NULL | 마지막 메시지 시각으로 갱신 |

### 3.8 `conversation_participants`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| conversation_id | INTEGER | FK → conversations.id ON DELETE CASCADE, PK | |
| user_id | INTEGER | FK → users.id ON DELETE CASCADE, PK | |

**PK**: `(conversation_id, user_id)` — 복합  
1:1 DM은 애플리케이션 레이어에서 참가자 2명으로 보장

### 3.9 `messages`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK | |
| conversation_id | INTEGER | FK → conversations.id ON DELETE CASCADE, NOT NULL, INDEX | |
| sender_id | INTEGER | FK → users.id ON DELETE CASCADE, NOT NULL | |
| body | TEXT | NOT NULL | |
| read_at | DATETIME | NULL | 읽음 처리 시각 |
| created_at | DATETIME | NOT NULL, server_default=now() | |

**인덱스**: `(conversation_id, created_at)`

### 3.10 `notifications`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK | |
| user_id | INTEGER | FK → users.id ON DELETE CASCADE | 수신자 |
| actor_id | INTEGER | FK → users.id ON DELETE SET NULL, NULL | 행동 주체 |
| type | VARCHAR(32) | NOT NULL | `like`, `comment`, `follow`, `mention` 등 |
| post_id | INTEGER | FK → posts.id ON DELETE CASCADE, NULL | |
| comment_id | INTEGER | FK → comments.id ON DELETE SET NULL, NULL | 댓글 삭제 후 알림 유지, 참조만 해제 |
| is_read | BOOLEAN | NOT NULL, DEFAULT 0 | |
| created_at | DATETIME | NOT NULL, server_default=now() | |

**인덱스**: `(user_id, is_read, created_at)`

### 3.11 `saved_posts`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| user_id | INTEGER | FK → users.id ON DELETE CASCADE, PK, INDEX | 저장한 사용자 |
| post_id | INTEGER | FK → posts.id ON DELETE CASCADE, PK, INDEX | 저장된 게시물 |
| created_at | DATETIME | NOT NULL, server_default=now() | |

**PK**: `(user_id, post_id)` — 중복 저장 방지

## 4. ORM 관계 요약

| 모델 | 관계 |
|------|------|
| `User` | posts, comments, likes, saved_posts, following, followers, conversation_links, messages_sent, notifications |
| `Post` | author(User), media_items(PostMedia), comments, likes, saved_by, notifications |
| `PostMedia` | post(Post) |
| `Comment` | post(Post), user(User), notifications |
| `Like` | user(User), post(Post) |
| `Follow` | follower(User), followee(User) |
| `Conversation` | participants(ConversationParticipant), messages(Message) |
| `ConversationParticipant` | conversation, user |
| `Message` | conversation, sender(User) |
| `Notification` | user(수신자), actor(행동주체), post, comment |
| `SavedPost` | user, post |

## 5. Alembic 마이그레이션 이력

| 버전 ID | 설명 |
|---------|------|
| `a469b8d28f3e` | 초기 스키마 (전 테이블 생성) |
| `c1a4d0f2e9a1` | `users.is_admin BOOLEAN DEFAULT 0` 추가 |
| `d2e5f8a1b4c0` | `users.website VARCHAR(300)` 추가 |
| `f7a2b91c4d3e` | `post_media.media_type VARCHAR(16) DEFAULT 'image'` 추가 |

마이그레이션 적용:
```bash
cd backend
alembic upgrade head
```

## 6. 파생 데이터 (집계)

`users.posts_count`, `followers_count`, `following_count`는 컬럼이 아닌 **집계 쿼리**로 계산.  
부하 시에만 캐시 컬럼 도입 검토.

## 7. 삭제 정책 요약

| 삭제 대상 | CASCADE 적용 |
|-----------|-------------|
| User 삭제 | posts, comments, likes, saved_posts, follows, conversation_participants, messages_sent, notifications(수신) |
| Post 삭제 | post_media, comments, likes, saved_posts, notifications |
| Comment 삭제 | notifications.comment_id → SET NULL (알림 행은 유지) |

---

*API 필드 매핑은 `backend.md`, 프론트 타입은 `front.md` 참조.*
