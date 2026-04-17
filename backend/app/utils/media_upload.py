"""게시물·프로필 이미지 업로드용 MIME 보정 및 저장 경로 (라우터 간 순환 import 방지)."""

from __future__ import annotations

from pathlib import Path

from app.config import settings

ALLOWED_IMAGE = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_VIDEO = {"video/mp4", "video/webm"}


def _effective_content_type(filename: str | None, content_type: str | None) -> str:
    """브라우저/OS에 따라 MIME이 비어 있거나 octet-stream인 경우 파일명으로 보정합니다."""
    ct = (content_type or "").strip()
    low = ct.lower()
    if low.startswith("image/") or low.startswith("video/"):
        return ct
    if low in ALLOWED_IMAGE | ALLOWED_VIDEO:
        return ct
    if low not in ("", "application/octet-stream"):
        return ct
    name = (filename or "").lower()
    suffix_map: list[tuple[str, str]] = [
        (".jpg", "image/jpeg"),
        (".jpeg", "image/jpeg"),
        (".jpe", "image/jpeg"),
        (".jfif", "image/jpeg"),
        (".png", "image/png"),
        (".webp", "image/webp"),
        (".gif", "image/gif"),
        (".mp4", "video/mp4"),
        (".webm", "video/webm"),
        (".mov", "video/quicktime"),
    ]
    for suf, mime in suffix_map:
        if name.endswith(suf):
            return mime
    return ct


def _sniff_content_type_from_fileobj(fp) -> str | None:
    """파일명·MIME이 비어 있을 때 앞바이트로 형식을 추정합니다(Windows 등)."""
    try:
        pos = fp.tell()
    except (OSError, AttributeError):
        pos = 0
    try:
        fp.seek(0)
        head = fp.read(32)
    finally:
        try:
            fp.seek(pos)
        except (OSError, AttributeError):
            pass
    if len(head) >= 3 and head[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if len(head) >= 8 and head[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if len(head) >= 12 and head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "image/webp"
    if len(head) >= 6 and head[:6] in (b"GIF87a", b"GIF89a"):
        return "image/gif"
    if len(head) >= 12 and head[4:8] == b"ftyp":
        return "video/mp4"
    return None


def _guess_ext(content_type: str | None) -> str:
    if not content_type:
        return ".bin"
    ct = content_type.lower()
    if ct == "image/jpeg":
        return ".jpg"
    if ct == "image/png":
        return ".png"
    if ct == "image/webp":
        return ".webp"
    if ct == "video/mp4":
        return ".mp4"
    if ct == "video/webm":
        return ".webm"
    if ct == "image/gif":
        return ".gif"
    if ct == "video/quicktime":
        return ".mov"
    return ".bin"


def _media_type_from_ct(content_type: str | None) -> str:
    ct = (content_type or "").lower()
    if ct.startswith("video/"):
        return "video"
    return "image"


def _ensure_upload_dir() -> Path:
    root = Path(__file__).resolve().parent.parent.parent / settings.upload_dir
    root.mkdir(parents=True, exist_ok=True)
    return root
