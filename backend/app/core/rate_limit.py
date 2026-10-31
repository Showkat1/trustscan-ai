from __future__ import annotations

import asyncio
import time
from collections import defaultdict, deque
from collections.abc import Awaitable, Callable

from fastapi import HTTPException, Request, status

from app.core.config import settings


class InMemoryRateLimiter:
    """Single-process sliding-window limiter.

    For a multi-replica deployment, swap this for a Redis-backed limiter while
    keeping the same dependency interface.
    """

    def __init__(self) -> None:
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def check(self, key: str, *, limit: int, window_seconds: int) -> None:
        if not settings.rate_limit_enabled:
            return

        now = time.monotonic()
        cutoff = now - window_seconds
        async with self._lock:
            events = self._events[key]
            while events and events[0] < cutoff:
                events.popleft()
            if len(events) >= limit:
                retry_after = max(1, int(window_seconds - (now - events[0])))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please slow down and try again.",
                    headers={"Retry-After": str(retry_after)},
                )
            events.append(now)

            # Opportunistically drop empty buckets.
            if len(self._events) > 10_000:
                for bucket_key in [k for k, v in self._events.items() if not v]:
                    self._events.pop(bucket_key, None)


limiter = InMemoryRateLimiter()


def _client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(
    bucket: str,
    *,
    limit: int,
    window_seconds: int = 60,
    per_user: bool = False,
) -> Callable[[Request], Awaitable[None]]:
    async def dependency(request: Request) -> None:
        identity = getattr(request.state, "user_id", None) if per_user else None
        key = f"{bucket}:{identity or _client_key(request)}"
        await limiter.check(key, limit=limit, window_seconds=window_seconds)

    return dependency
