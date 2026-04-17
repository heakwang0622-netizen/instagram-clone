from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.comment import Comment
from app.models.like import Like
from app.models.post import Post
from app.models.saved_post import SavedPost
from app.schemas.common import PostMediaOut, PostOut, UserSummary


def _media_url_for_client(stored: str) -> str:
    if stored.startswith("http://") or stored.startswith("https://"):
        return stored
    return stored if stored.startswith("/") else f"/{stored}"


def _counts_map(db: Session, post_ids: list[int]) -> tuple[dict[int, int], dict[int, int]]:
    if not post_ids:
        return {}, {}
    likes = db.execute(
        select(Like.post_id, func.count(Like.id)).where(Like.post_id.in_(post_ids)).group_by(Like.post_id)
    ).all()
    comments = db.execute(
        select(Comment.post_id, func.count(Comment.id)).where(Comment.post_id.in_(post_ids)).group_by(Comment.post_id)
    ).all()
    return {r[0]: r[1] for r in likes}, {r[0]: r[1] for r in comments}


def _liked_set(db: Session, post_ids: list[int], user_id: int) -> set[int]:
    if not post_ids:
        return set()
    rows = db.scalars(
        select(Like.post_id).where(Like.user_id == user_id, Like.post_id.in_(post_ids))
    ).all()
    return set(rows)


def _saved_set(db: Session, post_ids: list[int], user_id: int) -> set[int]:
    if not post_ids:
        return set()
    rows = db.scalars(
        select(SavedPost.post_id).where(SavedPost.user_id == user_id, SavedPost.post_id.in_(post_ids))
    ).all()
    return set(rows)


def serialize_post(
    db: Session,
    post: Post,
    *,
    current_user_id: int | None,
    likes_m: dict[int, int] | None = None,
    comments_m: dict[int, int] | None = None,
    liked: set[int] | None = None,
    saved: set[int] | None = None,
) -> PostOut:
    pid = post.id
    if likes_m is None or comments_m is None:
        lm, cm = _counts_map(db, [pid])
        likes_m, comments_m = lm, cm
    if liked is None or saved is None:
        if current_user_id is not None:
            liked = _liked_set(db, [pid], current_user_id)
            saved = _saved_set(db, [pid], current_user_id)
        else:
            liked, saved = set(), set()

    media_items = sorted(post.media_items, key=lambda m: m.sort_order)
    media_out = [
        PostMediaOut(
            id=m.id,
            url=_media_url_for_client(m.media_url),
            media_type=m.media_type,
            sort_order=m.sort_order,
        )
        for m in media_items
    ]
    author = post.author
    return PostOut(
        id=post.id,
        user=UserSummary.model_validate(author),
        media=media_out,
        caption=post.caption,
        location=post.location,
        likes_count=likes_m.get(pid, 0),
        comments_count=comments_m.get(pid, 0),
        liked_by_me=pid in liked if current_user_id else False,
        saved_by_me=pid in saved if current_user_id else False,
        created_at=post.created_at,
        updated_at=post.updated_at,
    )


def serialize_posts(
    db: Session,
    posts: list[Post],
    current_user_id: int | None,
) -> list[PostOut]:
    if not posts:
        return []
    ids = [p.id for p in posts]
    lm, cm = _counts_map(db, ids)
    liked = _liked_set(db, ids, current_user_id) if current_user_id else set()
    saved = _saved_set(db, ids, current_user_id) if current_user_id else set()
    return [serialize_post(db, p, current_user_id=current_user_id, likes_m=lm, comments_m=cm, liked=liked, saved=saved) for p in posts]


def load_posts_with_relations(db: Session, post_ids: list[int]) -> list[Post]:
    if not post_ids:
        return []
    posts = db.scalars(
        select(Post)
        .where(Post.id.in_(post_ids))
        .options(selectinload(Post.media_items), selectinload(Post.author))
    ).all()
    order = {pid: i for i, pid in enumerate(post_ids)}
    return sorted(posts, key=lambda p: order.get(p.id, 0))


def user_stats(db: Session, user_id: int) -> tuple[int, int, int]:
    from app.models.follow import Follow

    posts_c = db.scalar(select(func.count()).select_from(Post).where(Post.user_id == user_id)) or 0

    followers_c = db.scalar(
        select(func.count()).select_from(Follow).where(Follow.followee_id == user_id)
    ) or 0
    following_c = db.scalar(
        select(func.count()).select_from(Follow).where(Follow.follower_id == user_id)
    ) or 0
    return int(posts_c), int(followers_c), int(following_c)
