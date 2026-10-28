"""API routes for GlowUp AI: health check and image generation."""
import logging
import time
from typing import Dict, List

from fastapi import APIRouter, HTTPException, Request

from ..config import RATE_LIMIT_MAX, RATE_LIMIT_WINDOW
from ..schemas import GenerateRequest, GenerateResponse, ImageResult
from ..services.sensenova import ProviderError, generate_images

logger = logging.getLogger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# Lightweight in-memory rate limiter (sliding window, per client IP).
# Capacity is measured in IMAGES, not requests: a request consumes one slot
# per requested image (the validated ``n``, 1..MAX_IMAGES), so a single
# request cannot bypass the limit by generating several paid images at once.
# NOTE: This is a simple guard against accidental excessive usage. It is NOT a
# distributed, production-grade rate limiter and resets on server restart.
# On serverless (Vercel) each function instance keeps its own buckets, so the
# effective global limit is per instance and cold starts clear all state.
# ---------------------------------------------------------------------------
_rate_buckets: Dict[str, List[float]] = {}

# Upper bound on tracked client buckets so the table cannot grow without
# limit (e.g. many distinct client addresses across the process lifetime).
MAX_TRACKED_CLIENTS = 10_000

# Timestamp of the last opportunistic sweep of idle buckets (see
# _evict_idle_clients). Throttled so the O(n) scan runs at most once per
# rate-limit window rather than on every admission.
_last_sweep = 0.0


def _evict_idle_clients(now: float) -> None:
    """Drop buckets with no activity inside the current window.

    Timestamps are appended in order, so the last entry is the most recent
    activity recorded for that client.
    """
    global _last_sweep
    _last_sweep = now
    window_start = now - RATE_LIMIT_WINDOW
    idle = [
        key
        for key, times in _rate_buckets.items()
        if not times or times[-1] <= window_start
    ]
    for key in idle:
        del _rate_buckets[key]


def _rate_limit(key: str, cost: int = 1) -> bool:
    """Return True if ``cost`` image slots fit in the window, False otherwise.

    ``cost`` is the number of paid images the request wants to generate (the
    validated ``n``). Capacity is checked BEFORE recording anything, so a
    rejected request never mutates the bucket — its accounting stays exactly
    as it was before the rejected attempt.

    Each admitted slot is recorded as one timestamp at ``now``; timestamps
    stay ordered, so window expiry, idle sweeps, and least-recently-active
    eviction behave exactly as with one-timestamp-per-request accounting.
    """
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW
    # The schema already guarantees n >= 1; clamp defensively so a bad cost
    # can never admit a request for free (cost 0) or record negative slots.
    cost = max(1, int(cost))
    bucket = _rate_buckets.get(key)
    if bucket is not None:
        # Evict timestamps outside the current window.
        bucket = [t for t in bucket if t > window_start]
        if not bucket:
            # Fully expired: forget the client instead of keeping an empty
            # bucket around indefinitely.
            del _rate_buckets[key]
            bucket = None
        else:
            _rate_buckets[key] = bucket
    # Admission test runs before any state is written: a rejection must not
    # create a bucket or append timestamps.
    if bucket is not None and len(bucket) + cost > RATE_LIMIT_MAX:
        return False
    if bucket is None:
        # New (or fully expired) client. Opportunistically sweep idle
        # buckets, throttled to at most once per window so the O(n) scan
        # does not run on every request.
        if now - _last_sweep >= RATE_LIMIT_WINDOW:
            _evict_idle_clients(now)
        # Bound the table before growing it, evicting the
        # least-recently-active clients if still at capacity.
        if len(_rate_buckets) >= MAX_TRACKED_CLIENTS:
            _evict_idle_clients(now)
        if len(_rate_buckets) >= MAX_TRACKED_CLIENTS:
            overflow = len(_rate_buckets) - MAX_TRACKED_CLIENTS + 1
            oldest = sorted(_rate_buckets, key=lambda k: _rate_buckets[k][-1])
            for stale_key in oldest[:overflow]:
                del _rate_buckets[stale_key]
        bucket = []
        _rate_buckets[key] = bucket
        # A brand-new bucket starts empty, so only the cost itself can
        # exceed the limit (e.g. cost > RATE_LIMIT_MAX).
        if cost > RATE_LIMIT_MAX:
            del _rate_buckets[key]
            return False
    bucket.extend([now] * cost)
    return True


@router.get("/api/health")
def health() -> Dict[str, object]:
    """Minimal, non-sensitive health/status response."""
    from ..config import SENSENOVA_API_KEY

    return {
        "status": "ok",
        "provider_configured": bool(SENSENOVA_API_KEY),
    }


@router.post("/api/generate", response_model=GenerateResponse)
async def generate(req: Request, payload: GenerateRequest) -> GenerateResponse:
    """Generate images from a text prompt via the SenseNova provider.

    The request body is validated by the ``GenerateRequest`` Pydantic model.
    """
    # Conservative client identification: use only the socket peer address.
    # We deliberately do NOT read X-Forwarded-For / X-Real-IP because there is
    # no explicit trusted-proxy configuration, and those headers are
    # client-spoofable. Limitation: behind a proxy or serverless platform the
    # peer address is the proxy itself, so all such requests may share one
    # bucket. Resolving that safely requires trusted-proxy configuration,
    # which is out of scope for this focused change.
    client = req.client.host if req.client else "unknown"
    # Charge the limiter in images: payload.n is already validated to be
    # 1..MAX_IMAGES, so a request for 2 images consumes 2 slots.
    if not _rate_limit(client, cost=payload.n):
        logger.warning(
            "Rate limit exceeded for client %s (requested %d images)",
            client,
            payload.n,
        )
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please slow down and try again shortly.",
        )

    try:
        images = await generate_images(
            prompt=payload.prompt,
            size=payload.size,
            n=payload.n,
            prompt_extend=payload.prompt_extend,
            watermark=payload.watermark,
        )
    except ProviderError as exc:
        logger.error("Generation failed: %s", exc.message)
        raise HTTPException(status_code=exc.status_code, detail=exc.message)

    return GenerateResponse(
        success=True,
        images=[ImageResult(**img) for img in images],
        prompt=payload.prompt,
    )
