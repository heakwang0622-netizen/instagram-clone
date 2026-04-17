"""핵심 API 스모크 테스트 (동기 httpx).

사용법:
  1) 터미널에서 백엔드를 띄운 뒤 실행합니다.
     uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
  2) 다른 터미널에서:
     python scripts/test_api.py

기본 대상 URL은 `http://127.0.0.1:8000` 입니다. 바꾸려면:
  set API_BASE_URL=http://127.0.0.1:9000   (Windows PowerShell: $env:API_BASE_URL=...)
"""

from __future__ import annotations

import io
import os
import sys
import time
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

DEFAULT_BASE = "http://127.0.0.1:8000"


def main() -> int:
    base = os.environ.get("API_BASE_URL", DEFAULT_BASE).rstrip("/")
    results: list[tuple[str, bool, str]] = []

    def ok(name: str, cond: bool, detail: str = "") -> None:
        results.append((name, cond, detail))

    try:
        with httpx.Client(base_url=base, timeout=60.0) as c:
            r = c.get("/api/v1/health")
            ok("GET /api/v1/health", r.status_code == 200, r.text[:120])
            if r.status_code != 200:
                print(f"서버에 연결할 수 없습니다: {base}\n위 주석대로 uvicorn을 실행했는지 확인하세요.")
                _print_results(results)
                return 1

            suffix = str(int(time.time() * 1000))[-8:]
            email = f"apitest_{suffix}@test.com"
            username = f"apitest{suffix}"
            reg = c.post(
                "/api/v1/auth/register",
                json={
                    "email": email,
                    "password": "testpass123",
                    "username": username,
                    "full_name": "API Tester",
                },
            )
            ok("POST /auth/register", reg.status_code == 201, reg.text[:200])
            if reg.status_code != 201:
                _print_results(results)
                return 1

            token = reg.json()["access_token"]
            uid = reg.json()["user"]["id"]
            headers = {"Authorization": f"Bearer {token}"}

            login = c.post(
                "/api/v1/auth/login",
                json={"email": email, "password": "testpass123"},
            )
            ok("POST /auth/login", login.status_code == 200, f"uid={login.json().get('user', {}).get('id')}")

            me = c.get("/api/v1/users/me", headers=headers)
            ok("GET /users/me", me.status_code == 200, f"posts={me.json().get('posts_count')}")

            login2 = c.post(
                "/api/v1/auth/login",
                json={"email": "test@gmail.com", "password": "12345"},
            )
            seed_token = None
            h2: dict[str, str] = {}
            if login2.status_code == 200:
                seed_token = login2.json()["access_token"]
                h2 = {"Authorization": f"Bearer {seed_token}"}
                ok("seed login (test@gmail.com)", True, "ok")

                feed = c.get("/api/v1/posts/feed", headers=h2)
                ok("GET /posts/feed", feed.status_code == 200, f"n={len(feed.json().get('items', []))}")

                explore = c.get("/api/v1/posts/explore")
                ok("GET /posts/explore", explore.status_code == 200, f"n={len(explore.json().get('items', []))}")

                sug = c.get("/api/v1/users/suggested", headers=h2)
                ok("GET /users/suggested", sug.status_code == 200, f"n={len(sug.json())}")

                items = feed.json().get("items") or []
                if items:
                    pid = items[0]["id"]
                    post = c.get(f"/api/v1/posts/{pid}", headers=h2)
                    ok("GET /posts/{id}", post.status_code == 200, f"likes={post.json().get('likes_count')}")

                    like = c.post(f"/api/v1/posts/{pid}/like", headers=h2)
                    ok("POST /posts/{id}/like", like.status_code == 200, like.text[:80])

                    like_again = c.post(f"/api/v1/posts/{pid}/like", headers=h2)
                    ok(
                        "POST /posts/{id}/like (idempotent)",
                        like_again.status_code == 200 and "already" in like_again.text.lower(),
                        like_again.text[:80],
                    )

                    unlike = c.delete(f"/api/v1/posts/{pid}/like", headers=h2)
                    ok("DELETE /posts/{id}/like", unlike.status_code == 204, "")

                    cm = c.post(
                        f"/api/v1/posts/{pid}/comments",
                        headers=h2,
                        json={"text": "smoke test comment"},
                    )
                    ok("POST /posts/{id}/comments", cm.status_code == 201, cm.text[:100])

                    comments = c.get(f"/api/v1/posts/{pid}/comments")
                    ok("GET /posts/{id}/comments", comments.status_code == 200, f"n={len(comments.json())}")

                    save = c.post(f"/api/v1/posts/{pid}/save", headers=h2)
                    ok("POST /posts/{id}/save", save.status_code == 200, save.text[:60])

                    saved_list = c.get("/api/v1/users/me/saved", headers=h2)
                    ok(
                        "GET /users/me/saved",
                        saved_list.status_code == 200,
                        f"n={len(saved_list.json().get('items', []))}",
                    )
            else:
                ok("seed login", False, login2.text[:200])

            png = (
                b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08"
                b"\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05"
                b"\x18\x0d\n\x1f\x00\x00\x00\x00IEND\xaeB`\x82"
            )
            up = c.post(
                "/api/v1/posts",
                headers=headers,
                data={"caption": "smoke upload", "location": "Test City"},
                files=[("files", ("t.png", io.BytesIO(png), "image/png"))],
            )
            ok("POST /posts (multipart)", up.status_code == 201, up.text[:150])
            if up.status_code == 201:
                new_pid = up.json()["id"]
                del_p = c.delete(f"/api/v1/posts/{new_pid}", headers=headers)
                ok("DELETE /posts/{id} (own)", del_p.status_code == 204, "")

            search = c.get("/api/v1/search/users", params={"q": "test"})
            ok("GET /search/users", search.status_code == 200, f"n={len(search.json())}")

            if seed_token:
                dm = c.post("/api/v1/conversations", headers=h2, json={"user_id": uid})
                ok("POST /conversations", dm.status_code == 200, dm.text[:80])
                if dm.status_code == 200:
                    cid = dm.json()["id"]
                    msg = c.post(
                        f"/api/v1/conversations/{cid}/messages",
                        headers=h2,
                        json={"body": "hello"},
                    )
                    ok("POST /conversations/{id}/messages", msg.status_code == 201, msg.text[:80])
                    rd = c.post(f"/api/v1/conversations/{cid}/read", headers=h2)
                    ok("POST /conversations/{id}/read", rd.status_code == 204, "")

            notif = c.get("/api/v1/notifications", headers=headers)
            ok("GET /notifications", notif.status_code == 200, f"n={len(notif.json().get('items', []))}")

    except httpx.ConnectError as e:
        print(f"연결 실패 ({base}): {e}")
        return 1

    _print_results(results)
    if any(not x[1] for x in results):
        return 1
    return 0


def _print_results(results: list[tuple[str, bool, str]]) -> None:
    print(f"--- API Smoke Test ({os.environ.get('API_BASE_URL', DEFAULT_BASE)}) ---")
    for name, passed, detail in results:
        status = "PASS" if passed else "FAIL"
        print(f"  [{status}] {name}: {detail}")


if __name__ == "__main__":
    sys.exit(main())
