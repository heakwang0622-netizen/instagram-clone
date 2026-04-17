from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.common import UserSummary

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/users", response_model=list[UserSummary])
def search_users(
    db: Annotated[Session, Depends(get_db)],
    q: str = Query("", max_length=100),
    limit: int = Query(50, ge=1, le=100),
) -> list[UserSummary]:
    t = f"%{q.strip()}%"
    if not q.strip():
        rows = db.scalars(select(User).where(User.is_active == True).limit(limit)).all()  # noqa: E712
    else:
        rows = db.scalars(
            select(User)
            .where(
                User.is_active == True,  # noqa: E712
                or_(User.username.ilike(t), User.full_name.ilike(t)),
            )
            .limit(limit)
        ).all()
    return [UserSummary.model_validate(u) for u in rows]
