from __future__ import annotations

import shutil
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_optional_user
from app.models.follow import Follow
from app.models.post import Post
from app.models.saved_post import SavedPost
from app.models.user import User
from app.schemas.common import (
    MeUpdateBody,
    PasswordUpdateBody,
    PostListResponse,
    SuggestedUserOut,
    UserOut,
    UserProfileOut,
    UserSummary,
)
from app.services.notify import notify
from app.services.post_serialize import load_posts_with_relations, serialize_posts, user_stats
from app.utils.media_upload import (
    _effective_content_type,
    _ensure_upload_dir,
    _guess_ext,
    _sniff_content_type_from_fileobj,
)
from app.utils.security import hash_password, verify_password

router = APIRouter(prefix="/users", tags=["users"])

_AVATAR_TYPES = frozenset({"image/jpeg", "image/png", "image/webp", "image/gif"})


def _get_user_by_username(db: Session, username: str) -> User | None:
    return db.scalars(select(User).where(User.username == username)).first()


@router.get("/me", response_model=UserProfileOut)
def get_me(
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
) -> UserProfileOut:
    pc, fc, fgc = user_stats(db, me.id)
    return UserProfileOut(
        **UserOut.model_validate(me).model_dump(),
        posts_count=pc,
        followers_count=fc,
        following_count=fgc,
        is_following=None,
    )


@router.patch("/me", response_model=UserOut)
def patch_me(
    body: MeUpdateBody,
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
) -> UserOut:
    if body.full_name is not None:
        me.full_name = body.full_name.strip() or None
    if body.bio is not None:
        me.bio = body.bio.strip() or None
    if body.avatar_url is not None:
        me.avatar_url = body.avatar_url.strip() or None
    if body.website is not None:
        me.website = body.website.strip() or None
    if body.email is not None:
        em = body.email.strip().lower()
        if not em:
            raise HTTPException(status_code=422, detail="이메일을 입력해 주세요.")
        if em != me.email:
            taken = db.scalars(select(User.id).where(User.email == em, User.id != me.id)).first()
            if taken is not None:
                raise HTTPException(status_code=409, detail="이미 사용 중인 이메일입니다.")
            me.email = em
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="이미 사용 중인 이메일입니다.") from None
    db.refresh(me)
    return UserOut.model_validate(me)


@router.post("/me/avatar", response_model=UserOut)
def upload_me_avatar(
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
    file: UploadFile = File(...),
) -> UserOut:
    root = _ensure_upload_dir()
    ct = _effective_content_type(file.filename, file.content_type)
    low = (ct or "").lower()
    if not low or low == "application/octet-stream":
        sniff = _sniff_content_type_from_fileobj(file.file)
        if sniff:
            ct = sniff
            low = (ct or "").lower()
    if low not in _AVATAR_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="JPEG, PNG, WebP, GIF 이미지만 업로드할 수 있습니다.",
        )
    ext = _guess_ext(ct)
    if ext not in (".jpg", ".png", ".webp", ".gif"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="JPEG, PNG, WebP, GIF 이미지만 업로드할 수 있습니다.",
        )
    fname = f"avatar_{me.id}_{uuid.uuid4().hex}{ext}"
    dest = root / fname
    with dest.open("wb") as out:
        shutil.copyfileobj(file.file, out)
    me.avatar_url = f"/media/{fname}"
    db.commit()
    db.refresh(me)
    return UserOut.model_validate(me)


@router.patch("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def patch_password(
    body: PasswordUpdateBody,
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
) -> None:
    if not verify_password(body.current_password, me.password_hash):
        raise HTTPException(status_code=400, detail="현재 비밀번호가 올바르지 않습니다.")
    me.password_hash = hash_password(body.new_password)
    db.commit()


@router.get("/me/saved", response_model=PostListResponse)
def saved_posts(
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
    limit: int = Query(50, ge=1, le=100),
) -> PostListResponse:
    rows = db.scalars(
        select(SavedPost.post_id)
        .where(SavedPost.user_id == me.id)
        .order_by(SavedPost.created_at.desc())
        .limit(limit)
    ).all()
    posts = load_posts_with_relations(db, list(rows))
    return PostListResponse(items=serialize_posts(db, posts, me.id))


@router.get("/suggested", response_model=list[SuggestedUserOut])
def suggested_users(
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
    limit: int = Query(8, ge=1, le=50),
) -> list[SuggestedUserOut]:
    """팔로우하지 않은 계정을 우선 추천하고, 부족하면 다른 활성 계정으로 채웁니다."""
    following_rows = db.scalars(select(Follow.followee_id).where(Follow.follower_id == me.id)).all()
    following_ids = set(following_rows)

    base = select(User).where(User.id != me.id, User.is_active == True)  # noqa: E712

    q_primary = base
    if following_ids:
        q_primary = q_primary.where(User.id.not_in(following_ids))
    primary = list(db.scalars(q_primary.order_by(User.created_at.desc()).limit(limit)).all())

    users: list[User] = list(primary)
    if len(users) < limit:
        need = limit - len(users)
        got_ids = {u.id for u in users}
        q_fill = select(User).where(
            User.id != me.id,
            User.is_active == True,  # noqa: E712
            User.id.not_in(got_ids),
        )
        extra = list(db.scalars(q_fill.order_by(func.random()).limit(need)).all())
        users.extend(extra)

    if not users:
        users = list(db.scalars(base.order_by(User.id.desc()).limit(limit)).all())

    out: list[SuggestedUserOut] = []
    for u in users[:limit]:
        out.append(
            SuggestedUserOut(
                id=u.id,
                username=u.username,
                full_name=u.full_name,
                avatar_url=u.avatar_url,
                is_following=u.id in following_ids,
            )
        )
    return out


@router.get("/{username}", response_model=UserProfileOut)
def get_profile(
    username: str,
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User | None, Depends(get_optional_user)],
) -> UserProfileOut:
    u = _get_user_by_username(db, username)
    if u is None:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    pc, fc, fgc = user_stats(db, u.id)
    is_following = None
    if me is not None and me.id != u.id:
        is_following = (
            db.scalars(
                select(Follow).where(Follow.follower_id == me.id, Follow.followee_id == u.id)
            ).first()
            is not None
        )
    return UserProfileOut(
        **UserOut.model_validate(u).model_dump(),
        posts_count=pc,
        followers_count=fc,
        following_count=fgc,
        is_following=is_following,
    )


@router.get("/{username}/followers", response_model=list[UserSummary])
def followers(
    username: str,
    db: Annotated[Session, Depends(get_db)],
) -> list[UserSummary]:
    u = _get_user_by_username(db, username)
    if u is None:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    rows = db.scalars(
        select(User)
        .join(Follow, Follow.follower_id == User.id)
        .where(Follow.followee_id == u.id)
    ).all()
    return [UserSummary.model_validate(x) for x in rows]


@router.get("/{username}/following", response_model=list[UserSummary])
def following(
    username: str,
    db: Annotated[Session, Depends(get_db)],
) -> list[UserSummary]:
    u = _get_user_by_username(db, username)
    if u is None:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    rows = db.scalars(
        select(User)
        .join(Follow, Follow.followee_id == User.id)
        .where(Follow.follower_id == u.id)
    ).all()
    return [UserSummary.model_validate(x) for x in rows]


@router.get("/{username}/posts", response_model=PostListResponse)
def user_posts(
    username: str,
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User | None, Depends(get_optional_user)],
    limit: int = Query(30, ge=1, le=100),
    cursor: int | None = Query(None, description="이전 페이지 마지막 게시물 id보다 작은 id부터"),
) -> PostListResponse:
    u = _get_user_by_username(db, username)
    if u is None:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    q = select(Post.id).where(Post.user_id == u.id).order_by(Post.id.desc()).limit(limit + 1)
    if cursor is not None:
        c_post = db.get(Post, cursor)
        if c_post is None or c_post.user_id != u.id:
            raise HTTPException(status_code=400, detail="잘못된 cursor입니다.")
        q = select(Post.id).where(Post.user_id == u.id, Post.id < c_post.id).order_by(Post.id.desc()).limit(limit + 1)
    ids = list(db.scalars(q).all())
    has_next = len(ids) > limit
    ids = ids[:limit]
    posts = load_posts_with_relations(db, ids)
    uid = me.id if me else None
    return PostListResponse(
        items=serialize_posts(db, posts, uid),
        next_cursor=str(ids[-1]) if has_next and ids else None,
    )


@router.post("/{user_id}/follow", status_code=status.HTTP_200_OK)
def follow_user(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
) -> dict[str, str]:
    if user_id == me.id:
        raise HTTPException(status_code=400, detail="자기 자신을 팔로우할 수 없습니다.")
    other = db.get(User, user_id)
    if other is None:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    f = Follow(follower_id=me.id, followee_id=user_id)
    db.add(f)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return {"status": "already_following"}
    notify(db, user_id=user_id, actor_id=me.id, type_="follow")
    db.commit()
    return {"status": "ok"}


@router.delete("/{user_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_user(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
) -> None:
    row = db.scalars(
        select(Follow).where(Follow.follower_id == me.id, Follow.followee_id == user_id)
    ).first()
    if row:
        db.delete(row)
        db.commit()
