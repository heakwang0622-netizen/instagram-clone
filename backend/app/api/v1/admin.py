from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_admin_user
from app.models.comment import Comment
from app.models.like import Like
from app.models.post import Post
from app.models.user import User
from app.schemas.common import (
    AdminPostRow,
    AdminPostsResponse,
    AdminStatsResponse,
    AdminUserRow,
    AdminUsersResponse,
    UserSummary,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStatsResponse)
def admin_stats(
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[User, Depends(get_admin_user)],
) -> AdminStatsResponse:
    today = date.today()
    return AdminStatsResponse(
        users_total=int(db.scalar(select(func.count(User.id))) or 0),
        users_today=int(db.scalar(select(func.count(User.id)).where(func.date(User.created_at) == today)) or 0),
        posts_total=int(db.scalar(select(func.count(Post.id))) or 0),
        posts_today=int(db.scalar(select(func.count(Post.id)).where(func.date(Post.created_at) == today)) or 0),
        comments_total=int(db.scalar(select(func.count(Comment.id))) or 0),
        likes_total=int(db.scalar(select(func.count(Like.id))) or 0),
    )


@router.get("/users", response_model=AdminUsersResponse)
def admin_users(
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[User, Depends(get_admin_user)],
    q: str = Query("", max_length=100),
    limit: int = Query(30, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> AdminUsersResponse:
    base = select(User)
    total_q = select(func.count(User.id))
    if q.strip():
        t = f"%{q.strip()}%"
        cond = or_(User.username.ilike(t), User.email.ilike(t), User.full_name.ilike(t))
        base = base.where(cond)
        total_q = total_q.where(cond)
    rows = db.scalars(base.order_by(User.created_at.desc()).limit(limit).offset(offset)).all()
    out: list[AdminUserRow] = []
    for u in rows:
        posts_count = int(db.scalar(select(func.count(Post.id)).where(Post.user_id == u.id)) or 0)
        out.append(
            AdminUserRow(
                id=u.id,
                username=u.username,
                email=u.email,
                full_name=u.full_name,
                created_at=u.created_at,
                is_active=u.is_active,
                is_admin=u.is_admin,
                posts_count=posts_count,
            )
        )
    total = int(db.scalar(total_q) or 0)
    return AdminUsersResponse(items=out, total=total)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_user(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[User, Depends(get_admin_user)],
) -> None:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="본인 관리자 계정은 삭제할 수 없습니다.")
    db.delete(user)
    db.commit()


@router.get("/posts", response_model=AdminPostsResponse)
def admin_posts(
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[User, Depends(get_admin_user)],
    q: str = Query("", max_length=200),
    limit: int = Query(30, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> AdminPostsResponse:
    base = select(Post).join(User, User.id == Post.user_id)
    total_q = select(func.count(Post.id)).join(User, User.id == Post.user_id)
    if q.strip():
        t = f"%{q.strip()}%"
        cond = or_(Post.caption.ilike(t), User.username.ilike(t))
        base = base.where(cond)
        total_q = total_q.where(cond)
    rows = db.scalars(base.order_by(Post.created_at.desc()).limit(limit).offset(offset)).all()
    out: list[AdminPostRow] = []
    for p in rows:
        author = db.get(User, p.user_id)
        likes_count = int(db.scalar(select(func.count(Like.id)).where(Like.post_id == p.id)) or 0)
        comments_count = int(db.scalar(select(func.count(Comment.id)).where(Comment.post_id == p.id)) or 0)
        if author is None:
            continue
        out.append(
            AdminPostRow(
                id=p.id,
                author=UserSummary.model_validate(author),
                caption=p.caption,
                created_at=p.created_at,
                likes_count=likes_count,
                comments_count=comments_count,
            )
        )
    total = int(db.scalar(total_q) or 0)
    return AdminPostsResponse(items=out, total=total)


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_post(
    post_id: int,
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[User, Depends(get_admin_user)],
) -> None:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="게시물을 찾을 수 없습니다.")
    db.delete(post)
    db.commit()
