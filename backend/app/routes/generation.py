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
def generate(req: GenerateRequest, request: Request) -> GenerateResponse:
    """Generate images from a text prompt via the SenseNova provider."""
    client = request.client.host if request.client else "unknown"
    if not _rate_limit(client):
        logger.warning("Rate limit exceeded for client %s", client)
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please slow down and try again shortly.",
        )

    try:
        images = generate_images(
            prompt=req.prompt,
            size=req.size,
            n=req.n,
            prompt_extend=req.prompt_extend,
            watermark=req.watermark,
        )
    except ProviderError as exc:
        logger.error("Generation failed: %s", exc.message)
        raise HTTPException(status_code=exc.status_code, detail=exc.message)

    return GenerateResponse(
        success=True,
        images=[ImageResult(**img) for img in images],
        prompt=req.prompt,
    )
