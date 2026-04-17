from sqlalchemy.orm import Session

from app.models.notification import Notification


def notify(
    db: Session,
    *,
    user_id: int,
    actor_id: int | None,
    type_: str,
    post_id: int | None = None,
    comment_id: int | None = None,
) -> None:
    if actor_id is not None and actor_id == user_id:
        return
    n = Notification(
        user_id=user_id,
        actor_id=actor_id,
        type=type_,
        post_id=post_id,
        comment_id=comment_id,
        is_read=False,
    )
    db.add(n)
