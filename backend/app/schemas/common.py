from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    full_name: str | None = None
    avatar_url: str | None = None
    bio: str | None = None
    website: str | None = None
    is_admin: bool = False


class UserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str | None = None
    avatar_url: str | None = None


class SuggestedUserOut(BaseModel):
    """피드 사이드바 추천 — 미팔로우 우선, 부족 시 다른 계정으로 채움."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str | None = None
    avatar_url: str | None = None
    is_following: bool = False


class UserProfileOut(UserOut):
    posts_count: int = 0
    followers_count: int = 0
    following_count: int = 0
    is_following: bool | None = None


class LoginBody(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class RegisterBody(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=6, max_length=128)
    username: str = Field(min_length=1, max_length=30)
    full_name: str | None = Field(default=None, max_length=100)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class MeUpdateBody(BaseModel):
    full_name: str | None = Field(default=None, max_length=100)
    bio: str | None = Field(default=None, max_length=2000)
    avatar_url: str | None = Field(default=None, max_length=512)
    website: str | None = Field(default=None, max_length=300)
    email: str | None = Field(default=None, max_length=255)


class PasswordUpdateBody(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


class PostMediaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    media_type: str
    sort_order: int


class PostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user: UserSummary
    media: list[PostMediaOut]
    caption: str | None
    location: str | None
    likes_count: int
    comments_count: int
    liked_by_me: bool = False
    saved_by_me: bool = False
    created_at: datetime
    updated_at: datetime | None = None


class PostListResponse(BaseModel):
    items: list[PostOut]
    next_cursor: str | None = None


class PostPatchBody(BaseModel):
    caption: str | None = Field(default=None, max_length=5000)
    location: str | None = Field(default=None, max_length=255)


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user: UserSummary
    text: str
    created_at: datetime


class CommentCreateBody(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class ConversationCreateBody(BaseModel):
    user_id: int


class MessageCreateBody(BaseModel):
    body: str = Field(min_length=1, max_length=8000)


class ConversationOut(BaseModel):
    id: int
    peer: UserSummary
    last_message: str | None
    last_at: datetime | None
    unread: int


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender_id: int
    body: str
    created_at: datetime
    read_at: datetime | None


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    actor: UserSummary | None
    post_id: int | None
    comment_id: int | None
    is_read: bool
    created_at: datetime


class NotificationListResponse(BaseModel):
    items: list[NotificationOut]


class IdResponse(BaseModel):
    id: int


class AdminUserRow(BaseModel):
    id: int
    username: str
    email: str
    full_name: str | None
    created_at: datetime
    is_active: bool
    is_admin: bool
    posts_count: int


class AdminUsersResponse(BaseModel):
    items: list[AdminUserRow]
    total: int


class AdminPostRow(BaseModel):
    id: int
    author: UserSummary
    caption: str | None
    created_at: datetime
    likes_count: int
    comments_count: int


class AdminPostsResponse(BaseModel):
    items: list[AdminPostRow]
    total: int


class AdminStatsResponse(BaseModel):
    users_total: int
    users_today: int
    posts_total: int
    posts_today: int
    comments_total: int
    likes_total: int
