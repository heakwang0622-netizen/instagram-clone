from __future__ import annotations

import shutil
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import and_, exists, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.dependencies import get_current_user, get_optional_user
from app.models.comment import Comment
from app.models.follow import Follow
from app.models.like import Like
from app.models.post import Post, PostMedia
from app.models.saved_post import SavedPost
from app.models.user import User
from app.schemas.common import (
    CommentCreateBody,
    CommentOut,
    PostListResponse,
    PostOut,
    PostPatchBody,
    UserSummary,
)
from app.services.notify import notify
from app.services.post_serialize import load_posts_with_relations, serialize_post, serialize_posts
from app.utils.media_upload import (
    ALLOWED_IMAGE,
    ALLOWED_VIDEO,
    _effective_content_type,
    _ensure_upload_dir,
    _guess_ext,
    _media_type_from_ct,
    _sniff_content_type_from_fileobj,
)

router = APIRouter(prefix="/posts", tags=["posts"])


def _explore_like_count_subq():
    """게시물별 좋아요 수 (탐색 정렬·커서에 사용)."""
    return (
        select(func.count(Like.id))
        .where(Like.post_id == Post.id)
        .correlate(Post)
        .scalar_subquery()
    )


def _explore_decode_cursor(db: Session, cursor: str | None) -> tuple[int, int] | None:
    """탐색 커서: `좋아요수:게시물id` (구형: 숫자만 = 게시물 id, 해당 글의 현재 좋아요 수로 복원)."""
    if cursor is None or not str(cursor).strip():
        return None
    s = str(cursor).strip()
    if ':' in s:
        a, b = s.split(':', 1)
        try:
            cl, pid = int(a), int(b)
        except ValueError:
            raise HTTPException(status_code=400, detail="잘못된 cursor입니다.")
        if db.get(Post, pid) is None:
            raise HTTPException(status_code=400, detail="잘못된 cursor입니다.")
        return cl, pid
    try:
        pid = int(s)
    except ValueError:
        raise HTTPException(status_code=400, detail="잘못된 cursor입니다.")
    if db.get(Post, pid) is None:
        raise HTTPException(status_code=400, detail="잘못된 cursor입니다.")
    lc = int(db.scalar(select(func.count(Like.id)).where(Like.post_id == pid)) or 0)
    return lc, pid


@router.get("/feed", response_model=PostListResponse)
def feed(
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
    limit: int = Query(20, ge=1, le=50),
    cursor: int | None = Query(None),
) -> PostListResponse:
    followees = db.scalars(select(Follow.followee_id).where(Follow.follower_id == me.id)).all()
    allowed = list(followees) + [me.id]
    q = select(Post.id).where(Post.user_id.in_(allowed)).order_by(Post.id.desc()).limit(limit + 1)
    if cursor is not None:
        c = db.get(Post, cursor)
        if c is None:
            raise HTTPException(status_code=400, detail="잘못된 cursor입니다.")
        q = select(Post.id).where(Post.user_id.in_(allowed), Post.id < c.id).order_by(Post.id.desc()).limit(limit + 1)
    ids = list(db.scalars(q).all())
    has_next = len(ids) > limit
    ids = ids[:limit]
    posts = load_posts_with_relations(db, ids)
    return PostListResponse(
        items=serialize_posts(db, posts, me.id),
        next_cursor=str(ids[-1]) if has_next and ids else None,
    )


@router.get("/explore", response_model=PostListResponse)
def explore(
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User | None, Depends(get_optional_user)],
    limit: int = Query(30, ge=1, le=100),
    cursor: str | None = Query(None, description="이전 페이지 마지막 항목: 좋아요수:게시물id"),
    media_type: str | None = Query(None, description="image 또는 video"),
) -> PostListResponse:
    if media_type not in (None, "image", "video"):
        raise HTTPException(status_code=422, detail="media_type은 image 또는 video여야 합니다.")
    lc_sq = _explore_like_count_subq()
    cur = _explore_decode_cursor(db, cursor)
    q = select(Post.id)
    if media_type:
        q = q.where(exists().where(PostMedia.post_id == Post.id, PostMedia.media_type == media_type))
    if cur is not None:
        c_likes, c_id = cur
        q = q.where(or_(lc_sq < c_likes, and_(lc_sq == c_likes, Post.id < c_id)))
    q = q.order_by(lc_sq.desc(), Post.id.desc()).limit(limit + 1)
    ids = list(db.scalars(q).all())
    has_next = len(ids) > limit
    ids = ids[:limit]
    posts = load_posts_with_relations(db, ids)
    uid = me.id if me else None
    next_c: str | None = None
    if has_next and ids:
        last_id = ids[-1]
        last_likes = int(db.scalar(select(func.count(Like.id)).where(Like.post_id == last_id)) or 0)
        next_c = f"{last_likes}:{last_id}"
    return PostListResponse(
        items=serialize_posts(db, posts, uid),
        next_cursor=next_c,
    )


@router.post("", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def create_post(
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
    files: list[UploadFile] = File(...),
    caption: str = Form(""),
    location: str | None = Form(None),
) -> PostOut:
    if not files:
        raise HTTPException(status_code=422, detail="미디어 파일이 필요합니다.")
    root = _ensure_upload_dir()
    post = Post(user_id=me.id, caption=caption or None, location=location.strip() if location else None)
    db.add(post)
    db.flush()
    for i, f in enumerate(files):
        ct = _effective_content_type(f.filename, f.content_type)
        low = (ct or "").lower()
        if not low or low == "application/octet-stream":
            sniff = _sniff_content_type_from_fileobj(f.file)
            if sniff:
                ct = sniff
        if ct not in ALLOWED_IMAGE | ALLOWED_VIDEO and not ct.startswith("image/") and not ct.startswith("video/"):
            raise HTTPException(status_code=422, detail=f"지원하지 않는 형식입니다: {ct or f.filename}")
        ext = _guess_ext(ct)
        fname = f"{uuid.uuid4().hex}{ext}"
        dest = root / fname
        with dest.open("wb") as out:
            shutil.copyfileobj(f.file, out)
        url = f"/media/{fname}"
        media_type = _media_type_from_ct(ct)
        db.add(
            PostMedia(
                post_id=post.id,
                media_url=url,
                media_type=media_type,
                sort_order=i,
            )
        )
    db.commit()
    post = db.scalars(
        select(Post)
        .where(Post.id == post.id)
        .options(selectinload(Post.media_items), selectinload(Post.author))
    ).first()
    assert post is not None
    return serialize_post(db, post, current_user_id=me.id)


@router.get("/{post_id}", response_model=PostOut)
def get_post(
    post_id: int,
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User | None, Depends(get_optional_user)],
) -> PostOut:
    post = db.scalars(
        select(Post)
        .where(Post.id == post_id)
        .options(selectinload(Post.media_items), selectinload(Post.author))
    ).first()
    if post is None:
        raise HTTPException(status_code=404, detail="게시물을 찾을 수 없습니다.")
    uid = me.id if me else None
    return serialize_post(db, post, current_user_id=uid)


@router.patch("/{post_id}", response_model=PostOut)
def patch_post(
    post_id: int,
    body: PostPatchBody,
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
) -> PostOut:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="게시물을 찾을 수 없습니다.")
    if post.user_id != me.id:
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다.")
    if body.caption is not None:
        post.caption = body.caption
    if body.location is not None:
        post.location = body.location.strip() or None
    post.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(post)
    post = db.scalars(
        select(Post)
        .where(Post.id == post.id)
        .options(selectinload(Post.media_items), selectinload(Post.author))
    ).first()
    assert post is not None
    return serialize_post(db, post, current_user_id=me.id)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
) -> None:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="게시물을 찾을 수 없습니다.")
    if post.user_id != me.id:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")
    db.delete(post)
    db.commit()


@router.get("/{post_id}/comments", response_model=list[CommentOut])
def list_comments(
    post_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> list[CommentOut]:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="게시물을 찾을 수 없습니다.")
    rows = db.scalars(
        select(Comment)
        .where(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())
        .options(selectinload(Comment.user))
    ).all()
    return [
        CommentOut(
            id=c.id,
            user=UserSummary.model_validate(c.user),
            text=c.text,
            created_at=c.created_at,
        )
        for c in rows
    ]


@router.post("/{post_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def add_comment(
    post_id: int,
    body: CommentCreateBody,
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
) -> CommentOut:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="게시물을 찾을 수 없습니다.")
    c = Comment(post_id=post_id, user_id=me.id, text=body.text.strip())
    db.add(c)
    db.flush()
    notify(db, user_id=post.user_id, actor_id=me.id, type_="comment", post_id=post_id, comment_id=c.id)
    db.commit()
    db.refresh(c)
    c = db.scalars(select(Comment).where(Comment.id == c.id).options(selectinload(Comment.user))).first()
    assert c is not None
    return CommentOut(
        id=c.id,
        user=UserSummary.model_validate(c.user),
        text=c.text,
        created_at=c.created_at,
    )


@router.post("/{post_id}/like", status_code=status.HTTP_200_OK)
def like_post(
    post_id: int,
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
) -> dict[str, str]:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="게시물을 찾을 수 없습니다.")
    lk = Like(user_id=me.id, post_id=post_id)
    db.add(lk)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return {"status": "already_liked"}
    notify(db, user_id=post.user_id, actor_id=me.id, type_="like", post_id=post_id)
    db.commit()
    return {"status": "ok"}


@router.delete("/{post_id}/like", status_code=status.HTTP_204_NO_CONTENT)
def unlike_post(
    post_id: int,
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
) -> None:
    row = db.scalars(select(Like).where(Like.user_id == me.id, Like.post_id == post_id)).first()
    if row:
        db.delete(row)
        db.commit()


@router.post("/{post_id}/save", status_code=status.HTTP_200_OK)
def save_post(
    post_id: int,
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
) -> dict[str, str]:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="게시물을 찾을 수 없습니다.")
    sp = SavedPost(user_id=me.id, post_id=post_id)
    db.add(sp)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return {"status": "already_saved"}
    return {"status": "ok"}


@router.delete("/{post_id}/save", status_code=status.HTTP_204_NO_CONTENT)
def unsave_post(
    post_id: int,
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
) -> None:
    row = db.scalars(select(SavedPost).where(SavedPost.user_id == me.id, SavedPost.post_id == post_id)).first()
    if row:
        db.delete(row)
        db.commit()
