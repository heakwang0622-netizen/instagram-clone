# 프론트엔드 현황 문서 (Instagram 클론)

> 최종 업데이트: 2026-04-21

## 1. 기술 스택 (실제 구현)

| 항목 | 버전 |
|------|------|
| React | 19.2.4 |
| TypeScript | ~5.9.3 |
| Vite | 8.0.1 |
| React Router | 7.14.0 |
| TanStack Query | 5.96.2 |
| 스타일 | CSS Modules (전용) |

의존성 관리: `frontend/package.json`

## 2. 구현된 라우트 목록

| 경로 | 컴포넌트 | 인증 |
|------|----------|------|
| `/login` | `LoginPage` | 비로그인 전용(GuestRoute) |
| `/register` | `RegisterPage` | 비로그인 전용(GuestRoute) |
| `/` | `FeedPage` (관리자면 `/admin` 리다이렉트) | 공개 |
| `/explore` | `ExplorePage` | 공개 |
| `/search` | `SearchPage` | 공개 |
| `/p/:postId` | `PostDetailPage` | 공개 |
| `/p/:postId/edit` | `EditPostPage` | 필수(PrivateRoute) |
| `/create` | `CreatePostPage` | 필수 |
| `/reels` | `ReelsPage` | 공개 |
| `/direct` | `DirectPage` | 필수 |
| `/direct/:conversationId` | `DirectPage` | 필수 |
| `/notifications` | `NotificationsPage` | 필수 |
| `/saved` | `SavedPage` | 필수 |
| `/bookmarks` | `BookmarksPage` | 필수 |
| `/accounts/edit` | `AccountEditPage` | 필수 |
| `/settings` | `SettingsPage` | 필수 |
| `/settings/password` | `PasswordSettingsPage` | 필수 |
| `/settings/help` | `HelpSettingsPage` | 필수 |
| `/settings/about` | `AboutSettingsPage` | 필수 |
| `/:username` | `ProfilePage` | 공개 |
| `/:username/followers` | `FollowListPage` | 공개 |
| `/:username/following` | `FollowListPage` | 공개 |
| `/admin` | `AdminDashboard` | 필수(관리자) |
| `/admin/users` | `AdminUsers` | 필수(관리자) |
| `/admin/posts` | `AdminPosts` | 필수(관리자) |
| `*` | `NotFoundPage` | - |

## 3. 레이아웃 구조

```
src/components/layout/
  AppShell.tsx        # 전체 앱 래퍼 (데스크톱 사이드바 + 모바일 하단 탭)
  Sidebar.tsx         # 데스크톱 좌측 고정 내비게이션
  BottomNav.tsx       # 모바일 하단 탭 바
  AppTopNav.tsx       # 앱 상단 내비
  MobileHeader.tsx    # 모바일 헤더
```

- 데스크톱: 좌측 고정 Sidebar (아이콘 + 라벨)
- 모바일: 하단 BottomNav (홈, 탐색, 작성, DM, 프로필)
- 공통: Avatar, Skeleton, PostOptionsMenu, InstagramLogo 컴포넌트

## 4. 인증 (`src/features/auth/`)

- `AuthContext.tsx`: JWT Access Token을 메모리(Context)에 보관
- `PrivateRoute.tsx`: 미로그인 시 `/login`으로 리다이렉트
- `GuestRoute.tsx`: 로그인 시 `/`으로 리다이렉트
- 실제 API 연동:
  - `POST /api/v1/auth/login` — 이메일 + 비밀번호
  - `POST /api/v1/auth/register` — 이메일 + 유저네임 + 비밀번호 + 이름(선택)
  - `GET /api/v1/users/me` — 로그인 직후 프로필 조회

## 5. API 클라이언트 구조 (`src/lib/`)

| 파일 | 역할 |
|------|------|
| `api.ts` | `apiUrl()`, `fetchHealth()` — 베이스 URL 결정 (Vite 프록시 활용) |
| `auth-api.ts` | 로그인·회원가입·`/users/me` 호출, `mapApiUserToUser()` |
| `instagram-api.ts` | 피드·게시물·프로필·팔로우·좋아요·저장·댓글·검색·DM·알림 전 API |
| `posts-api.ts` | `instagram-api`의 re-export (하위 호환) |
| `mock-data.ts` | 오프라인 목업 데이터 |

**API 베이스 URL 결정 규칙**:
- `VITE_API_BASE_URL` 환경 변수가 있으면 해당 URL 사용
- 개발(`DEV`)이면 빈 문자열 → Vite 프록시(`/api`, `/media` → `http://127.0.0.1:8000`)
- 그 외: `http://127.0.0.1:8000`

## 6. 주요 기능 구현 현황

### 피드 (`FeedPage`, `PostCard`, `StoriesRow`)
- 팔로우 사용자 게시물 목록 (`GET /api/v1/posts/feed`)
- PostCard: 작성자, 캐러셀 이미지/동영상, 좋아요/댓글 수, 캡션
- StoriesRow: 상단 스토리 링크 행 (프로필 아바타 형태)

### 게시물 작성 (`CreatePostPage`)
- `multipart/form-data` 업로드 (`POST /api/v1/posts`)
- 이미지·동영상 미리보기, 캡션·위치 입력

### 탐색 (`ExplorePage`)
- 그리드 형태 게시물 목록 (`GET /api/v1/posts/explore`)

### 릴스 (`ReelsPage`)
- 동영상 게시물 표시 (별도 전용 API 없음, `post_media.media_type=video` 활용)

### 프로필 (`ProfilePage`, `FollowListPage`)
- 아바타, 통계(게시물·팔로워·팔로잉), 게시물 그리드
- 팔로우/언팔로우 버튼
- 팔로워/팔로잉 목록 페이지

### 검색 (`SearchPage`)
- 유저네임·이름 검색 (`GET /api/v1/search/users?q=`)

### DM (`DirectPage`)
- 대화 목록, 메시지 스레드, 메시지 전송
- `GET /api/v1/conversations`, `POST /api/v1/conversations/{id}/messages`

### 알림 (`NotificationsPage`)
- 좋아요·댓글·팔로우 알림 목록, 읽음 처리

### 저장됨 (`SavedPage`)
- `GET /api/v1/users/me/saved`

### 계정 편집 (`AccountEditPage`)
- `PATCH /api/v1/users/me` — 이름·바이오·아바타·웹사이트

### 관리자 패널 (`AdminDashboard`, `AdminUsers`, `AdminPosts`)
- 통계, 회원 목록/삭제, 게시물 목록/삭제
- `is_admin=true` 계정만 접근 가능

## 7. 타입 정의 (`src/types/index.ts`)

핵심 타입: `User`, `Post`, `PostMedia`, `Comment`, `Conversation`, `Message`, `AppNotification`

`User.id`는 문자열(프론트)이며 백엔드 정수 PK를 `String(id)`로 변환.

## 8. 폴더 구조

```
frontend/src/
  app/             # App.tsx (라우트 정의)
  components/      # 공통 UI (Avatar, Skeleton, Layout 등)
  features/        # auth, feed, create, explore, post, profile,
                   # search, direct, notifications, reels,
                   # misc, settings
  pages/admin/     # AdminDashboard, AdminLayout, AdminUsers, AdminPosts
  hooks/           # useRequireLogin
  lib/             # api.ts, auth-api.ts, instagram-api.ts, posts-api.ts, mock-data.ts
  services/        # api.ts (adminApi 헬퍼)
  types/           # index.ts
  styles/          # global.css
```

## 9. 환경 변수

파일: `frontend/.env`

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `VITE_API_BASE_URL` | 백엔드 URL (생략 시 Vite 프록시) | 없음 |

---

*API 계약은 `backend.md`, DB 스키마는 `db.md`, 실행 방법은 `guide.md` 참조.*
