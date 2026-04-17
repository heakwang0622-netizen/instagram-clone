from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.notification import Notification
from app.models.user import User
from app.schemas.common import NotificationListResponse, NotificationOut, UserSummary

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
) -> NotificationListResponse:
    rows = db.scalars(
        select(Notification)
        .where(Notification.user_id == me.id)
        .order_by(Notification.created_at.desc())
        .options(selectinload(Notification.actor))
    ).all()
    items: list[NotificationOut] = []
    for n in rows:
        actor = None
        if n.actor_id is not None and n.actor is not None:
            actor = UserSummary.model_validate(n.actor)
        items.append(
            NotificationOut(
                id=n.id,
                type=n.type,
                actor=actor,
                post_id=n.post_id,
                comment_id=n.comment_id,
                is_read=n.is_read,
                created_at=n.created_at,
            )
        )
    return NotificationListResponse(items=items)


@router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_notification_read(
    notification_id: int,
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
) -> None:
    n = db.get(Notification, notification_id)
    if n is None or n.user_id != me.id:
        raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다.")
    n.is_read = True
    db.commit()


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
) -> None:
    db.execute(
        update(Notification).where(Notification.user_id == me.id).values(is_read=True)
    )
    db.commit()
