import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.common import LoginBody, LoginResponse, RegisterBody, UserOut
from app.utils.security import hash_password, verify_password
from app.utils.token import create_access_token

router = APIRouter()

_USERNAME_RE = re.compile(r"^[a-zA-Z0-9._]{1,30}$")


@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterBody, db: Session = Depends(get_db)) -> LoginResponse:
    username = body.username.strip().lstrip("@")
    if not _USERNAME_RE.match(username):
        raise HTTPException(
            status_code=422,
            detail="사용자 이름은 영문, 숫자, 밑줄, 점만 사용할 수 있습니다.",
        )
    email = body.email.strip().lower()
    user = User(
        username=username,
        email=email,
        password_hash=hash_password(body.password),
        full_name=body.full_name.strip() if body.full_name else None,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="이미 사용 중인 이메일 또는 사용자 이름입니다.",
        )
    db.refresh(user)
    token = create_access_token(user.id)
    return LoginResponse(
        access_token=token,
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=LoginResponse)
def login(body: LoginBody, db: Session = Depends(get_db)) -> LoginResponse:
    login_id = body.email.strip()
    user = db.scalars(
        select(User).where(
            or_(
                User.email == login_id.lower(),
                User.username == login_id.lstrip("@"),
            )
        )
    ).first()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
        )
    token = create_access_token(user.id)
    return LoginResponse(
        access_token=token,
        user=UserOut.model_validate(user),
    )
