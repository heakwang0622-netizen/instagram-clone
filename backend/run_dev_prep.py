"""개발용: 마이그레이션 + 시드를 uvicorn 기동 전에 실행 (Windows 안정성)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def main() -> None:
    backend = Path(__file__).resolve().parent
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=backend,
        check=True,
    )
    if str(backend) not in sys.path:
        sys.path.insert(0, str(backend))
    from app.seed import seed_demo_data

    seed_demo_data()


if __name__ == "__main__":
    main()
