from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.comment import Comment
from app.models.post import Post
from app.models.user import User

router = APIRouter(prefix="/comments", tags=["comments"])


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
) -> None:
    c = db.get(Comment, comment_id)
    if c is None:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    post = db.get(Post, c.post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="게시물을 찾을 수 없습니다.")
    if c.user_id != me.id and post.user_id != me.id:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")
    db.delete(c)
    db.commit()
