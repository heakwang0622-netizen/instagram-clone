import argparse
import socket
import sys
import time
import warnings

warnings.filterwarnings("ignore", category=DeprecationWarning)


def _install_socketpair_retry() -> None:
    if not sys.platform.startswith("win"):
        return

    original = socket.socketpair

    def stable_socketpair(*args, **kwargs):  # type: ignore[no-untyped-def]
        last_err: OSError | None = None
        for _ in range(120):
            try:
                return original(*args, **kwargs)
            except OSError as e:
                if getattr(e, "winerror", None) == 10014:
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

    # Windows 환경에서 간헐 WinError 10014(socketpair) 완화
    _install_socketpair_retry()

    # Uvicorn(loop="asyncio")은 Windows에서 ProactorEventLoop를 직접 씁니다.
    # WindowsSelectorEventLoopPolicy를 켜면 Selector 초기화(socketpair)가 10014에 더 자주 걸릴 수 있어 두지 않습니다.

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
