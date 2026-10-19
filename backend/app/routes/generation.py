"""API routes for GlowUp AI: health check and image generation."""
import logging
import time
from typing import Dict, List

from fastapi import APIRouter, HTTPException, Request

from ..config import (
    MAX_IMAGES,
    MAX_PROMPT_LENGTH,
    MIN_IMAGES,
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW,
    SUPPORTED_SIZES,
)
from ..schemas import GenerateResponse, ImageResult
from ..services.sensenova import ProviderError, generate_images

logger = logging.getLogger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# Lightweight in-memory rate limiter (sliding window, per client IP).
# NOTE: This is a simple guard against accidental excessive usage. It is NOT a
# distributed, production-grade rate limiter and resets on server restart.
# ---------------------------------------------------------------------------
_rate_buckets: Dict[str, List[float]] = {}


def _rate_limit(key: str) -> bool:
    """Return True if the request is within the limit, False otherwise."""
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW
    bucket = _rate_buckets.setdefault(key, [])
    # Evict timestamps outside the current window.
    _rate_buckets[key] = [t for t in bucket if t > window_start]
    if len(_rate_buckets[key]) >= RATE_LIMIT_MAX:
        return False
    _rate_buckets[key].append(now)
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
async def generate(req: Request) -> GenerateResponse:
    """Generate images from a text prompt via the SenseNova provider."""
    # Parse JSON body manually to avoid pydantic dependency in routes
    import json
    try:
        body = json.loads(await req.body())
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body.")

    prompt = body.get("prompt", "").strip()
    if not prompt:
        raise HTTPException(status_code=422, detail="Prompt must not be empty.")
    if len(prompt) > MAX_PROMPT_LENGTH:
        raise HTTPException(status_code=422, detail=f"Prompt exceeds {MAX_PROMPT_LENGTH} characters.")

    size = body.get("size", "1024x1024")
    if size not in SUPPORTED_SIZES:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported size '{size}'. Supported: {sorted(SUPPORTED_SIZES)}",
        )

    n = body.get("n", 1)
    if not isinstance(n, int) or n < MIN_IMAGES or n > MAX_IMAGES:
        raise HTTPException(
            status_code=422,
            detail=f"Image count must be between {MIN_IMAGES} and {MAX_IMAGES}.",
        )

    prompt_extend = body.get("prompt_extend", True)
    watermark = body.get("watermark", True)

    client = req.client.host if req.client else "unknown"
    if not _rate_limit(client):
        logger.warning("Rate limit exceeded for client %s", client)
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please slow down and try again shortly.",
        )

    try:
        images = await generate_images(
            prompt=prompt,
            size=size,
            n=n,
            prompt_extend=prompt_extend,
            watermark=watermark,
        )
    except ProviderError as exc:
        logger.error("Generation failed: %s", exc.message)
        raise HTTPException(status_code=exc.status_code, detail=exc.message)

    return GenerateResponse(
        success=True,
        images=[ImageResult(**img) for img in images],
        prompt=prompt,
    )
