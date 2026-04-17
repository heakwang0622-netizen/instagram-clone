"""pytest 스모크 — 실행 전에 API 서버가 떠 있어야 합니다.

  API_BASE_URL=http://127.0.0.1:8000 pytest tests/test_smoke.py -q
"""

from __future__ import annotations

import os
import time

import httpx
import pytest

BASE = os.environ.get("API_BASE_URL", "http://127.0.0.1:8000").rstrip("/")


@pytest.fixture(scope="module")
def client() -> httpx.Client:
    with httpx.Client(base_url=BASE, timeout=30.0) as c:
        yield c


def test_health(client: httpx.Client) -> None:
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert "status" in r.json()


def test_register_login_me(client: httpx.Client) -> None:
    s = str(int(time.time() * 1000))[-8:]
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"py_{s}@t.com",
            "password": "password123",
            "username": f"pyuser{s}",
            "full_name": "Py",
        },
    )
    assert reg.status_code == 201, reg.text
    token = reg.json()["access_token"]
    h = {"Authorization": f"Bearer {token}"}
    me = client.get("/api/v1/users/me", headers=h)
    assert me.status_code == 200
    assert me.json()["username"] == f"pyuser{s}"


def test_feed_requires_auth(client: httpx.Client) -> None:
    r = client.get("/api/v1/posts/feed")
    assert r.status_code == 401


def test_explore_public(client: httpx.Client) -> None:
    r = client.get("/api/v1/posts/explore")
    assert r.status_code == 200
    assert "items" in r.json()
