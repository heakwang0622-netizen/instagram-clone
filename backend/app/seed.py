"""데모 계정·샘플 게시물을 DB에 한 번만 생성합니다."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.post import Post, PostMedia
from app.models.user import User
from app.utils.security import hash_password

TEST_EMAIL = "test@gmail.com"
TEST_PASSWORD = "12345"
TEST_USERNAME = "testuser"
ADMIN_EMAIL = "admin"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "pass123"


def seed_demo_data() -> None:
    db: Session = SessionLocal()
    try:
        admin = db.scalars(select(User).where(User.username == ADMIN_USERNAME)).first()
        if admin is None:
            admin = User(
                username=ADMIN_USERNAME,
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
                full_name="관리자",
                is_admin=True,
            )
            db.add(admin)
            db.commit()
        elif not admin.is_admin:
            admin.is_admin = True
            db.commit()

        user = db.scalars(select(User).where(User.email == TEST_EMAIL)).first()
        if user is None:
            user = User(
                username=TEST_USERNAME,
                email=TEST_EMAIL,
                password_hash=hash_password(TEST_PASSWORD),
                full_name="테스트 계정",
                avatar_url="https://picsum.photos/seed/testuser/150/150",
                bio="페이지 테스트용 계정입니다.",
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        has_post = db.scalars(select(Post.id).where(Post.user_id == user.id).limit(1)).first()
        if has_post is None:
            p1 = Post(
                user_id=user.id,
                caption="첫 번째 데모 게시물입니다 🌿",
                location="서울",
            )
            db.add(p1)
            db.flush()
            db.add(
                PostMedia(
                    post_id=p1.id,
                    media_url="https://picsum.photos/seed/post1/800/800",
                    media_type="image",
                    sort_order=0,
                )
            )
            p2 = Post(
                user_id=user.id,
                caption="두 번째 샘플 — 캐러셀 테스트",
            )
            db.add(p2)
            db.flush()
            db.add(
                PostMedia(
                    post_id=p2.id,
                    media_url="https://picsum.photos/seed/post2a/600/600",
                    media_type="image",
                    sort_order=0,
                )
            )
            db.add(
                PostMedia(
                    post_id=p2.id,
                    media_url="https://picsum.photos/seed/post2b/600/600",
                    media_type="image",
                    sort_order=1,
                )
            )
            db.commit()
    finally:
        db.close()
