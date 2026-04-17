from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.conversation import Conversation, ConversationParticipant, Message
from app.models.user import User
from app.schemas.common import ConversationCreateBody, ConversationOut, IdResponse, MessageCreateBody, MessageOut, UserSummary

router = APIRouter(prefix="/conversations", tags=["conversations"])


def _find_pair_conversation(db: Session, a: int, b: int) -> int | None:
    a_rows = db.scalars(select(ConversationParticipant.conversation_id).where(ConversationParticipant.user_id == a)).all()
    for cid in a_rows:
        uids = db.scalars(
            select(ConversationParticipant.user_id).where(ConversationParticipant.conversation_id == cid)
        ).all()
        if set(uids) == {a, b}:
            return cid
    return None


@router.get("", response_model=list[ConversationOut])
def list_conversations(
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
) -> list[ConversationOut]:
    cids = db.scalars(
        select(ConversationParticipant.conversation_id).where(ConversationParticipant.user_id == me.id)
    ).all()
    out: list[ConversationOut] = []
    for cid in cids:
        conv = db.get(Conversation, cid)
        if conv is None:
            continue
        peer_uid = None
        for row in db.scalars(
            select(ConversationParticipant.user_id).where(ConversationParticipant.conversation_id == cid)
        ).all():
            if row != me.id:
                peer_uid = row
                break
        if peer_uid is None:
            continue
        peer = db.get(User, peer_uid)
        if peer is None:
            continue
        last_msg = db.scalars(
            select(Message).where(Message.conversation_id == cid).order_by(Message.created_at.desc()).limit(1)
        ).first()
        unread = db.scalar(
            select(func.count())
            .select_from(Message)
            .where(
                Message.conversation_id == cid,
                Message.sender_id != me.id,
                Message.read_at.is_(None),
            )
        ) or 0
        out.append(
            ConversationOut(
                id=conv.id,
                peer=UserSummary.model_validate(peer),
                last_message=last_msg.body if last_msg else None,
                last_at=last_msg.created_at if last_msg else conv.updated_at or conv.created_at,
                unread=int(unread),
            )
        )
    out.sort(key=lambda x: x.last_at or datetime(1970, 1, 1), reverse=True)
    return out


@router.post("", response_model=IdResponse)
def create_or_get_conversation(
    body: ConversationCreateBody,
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
) -> IdResponse:
    other_id = body.user_id
    if other_id == me.id:
        raise HTTPException(status_code=400, detail="자기 자신과의 대화는 만들 수 없습니다.")
    other = db.get(User, other_id)
    if other is None:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    existing = _find_pair_conversation(db, me.id, other_id)
    if existing is not None:
        return IdResponse(id=existing)
    conv = Conversation()
    db.add(conv)
    db.flush()
    db.add(ConversationParticipant(conversation_id=conv.id, user_id=me.id))
    db.add(ConversationParticipant(conversation_id=conv.id, user_id=other_id))
    db.commit()
    return IdResponse(id=conv.id)


@router.get("/{conversation_id}/messages", response_model=list[MessageOut])
def list_messages(
    conversation_id: int,
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
) -> list[MessageOut]:
    part = db.scalars(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == me.id,
        )
    ).first()
    if part is None:
        raise HTTPException(status_code=404, detail="대화를 찾을 수 없습니다.")
    rows = db.scalars(
        select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at.asc())
    ).all()
    return [
        MessageOut(
            id=m.id,
            sender_id=m.sender_id,
            body=m.body,
            created_at=m.created_at,
            read_at=m.read_at,
        )
        for m in rows
    ]


@router.post("/{conversation_id}/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    conversation_id: int,
    body: MessageCreateBody,
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
) -> MessageOut:
    part = db.scalars(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == me.id,
        )
    ).first()
    if part is None:
        raise HTTPException(status_code=404, detail="대화를 찾을 수 없습니다.")
    m = Message(conversation_id=conversation_id, sender_id=me.id, body=body.body.strip())
    db.add(m)
    conv = db.get(Conversation, conversation_id)
    if conv:
        conv.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(m)
    return MessageOut(
        id=m.id,
        sender_id=m.sender_id,
        body=m.body,
        created_at=m.created_at,
        read_at=m.read_at,
    )


@router.post("/{conversation_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_read(
    conversation_id: int,
    db: Annotated[Session, Depends(get_db)],
    me: Annotated[User, Depends(get_current_user)],
) -> None:
    part = db.scalars(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == me.id,
        )
    ).first()
    if part is None:
        raise HTTPException(status_code=404, detail="대화를 찾을 수 없습니다.")
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    msgs = db.scalars(
        select(Message).where(
            Message.conversation_id == conversation_id,
            Message.sender_id != me.id,
            Message.read_at.is_(None),
        )
    ).all()
    for m in msgs:
        m.read_at = now
    conv = db.get(Conversation, conversation_id)
    if conv:
        conv.updated_at = now
    db.commit()
