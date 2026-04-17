import argparse
import asyncio
import socket
import sys
import time
import warnings

warnings.filterwarnings("ignore", category=DeprecationWarning)


def _install_socketpair_retry() -> None:
    original = socket.socketpair

    def stable_socketpair(*args, **kwargs):  # type: ignore[no-untyped-def]
        last_err: OSError | None = None
        for _ in range(80):
            try:
                return original(*args, **kwargs)
            except OSError as e:
                if sys.platform.startswith("win") and getattr(e, "winerror", None) == 10014:
                    last_err = e
                    time.sleep(0.02)
                    continue
                raise
        if last_err is not None:
            raise last_err
        return original(*args, **kwargs)

    socket.socketpair = stable_socketpair  # type: ignore[assignment]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--reload", action="store_true")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    # Python 3.14 + Windows 환경에서 socketpair 간헐 오류(WinError 10014) 회피
    _install_socketpair_retry()

    # Python 3.14 + Windows 환경에서 ProactorEventLoop 이슈 완화
    if sys.platform.startswith("win") and hasattr(asyncio, "WindowsSelectorEventLoopPolicy"):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        loop="asyncio",
        http="h11",
    )


if __name__ == "__main__":
    main()
