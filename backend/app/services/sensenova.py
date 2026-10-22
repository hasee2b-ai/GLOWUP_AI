"""SenseNova image-generation provider service.

This module is the only place that talks to the upstream provider. It builds
the request, maps provider errors to safe, user-readable messages, and normalizes
the response (base64 or URL) into a browser-usable form. It never logs the API
key or other secrets.
"""
import asyncio
import base64
import binascii
import logging
from typing import Any, Dict, List, Optional, Tuple

import httpx

from ..config import (
    REQUEST_TIMEOUT,
    SENSENOVA_API_KEY,
    SENSENOVA_BASE_URL,
    SENSENOVA_IMAGE_ENDPOINT,
    SENSENOVA_IMAGE_MODEL,
)

logger = logging.getLogger(__name__)

# The provider accepts only one image per request, so multiple requested images
# are produced by issuing several single-image calls. This cap bounds how many
# of those calls may be in flight at once, protecting the provider's rate limits.
MAX_PROVIDER_CONCURRENCY = 2

# Shared async HTTP client, created lazily on first use so importing this
# module never requires a running event loop. It is reused across requests
# for connection pooling and closed on app shutdown (see app/main.py).
_client: Optional[httpx.AsyncClient] = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient()
    return _client


async def close_client() -> None:
    """Close the shared client and release its connections (app shutdown)."""
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


class ProviderError(Exception):
    """An error originating from (or communicating with) the provider.

    Carries an HTTP status code that is safe to surface to the client, plus the
    upstream status for diagnostics. The message is user-readable and contains
    no credentials or internal stack traces.
    """

    def __init__(
        self,
        message: str,
        status_code: int = 502,
        provider_status: Optional[int] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.provider_status = provider_status


def _detect_image_mime(data: bytes) -> str:
    """Sniff the image MIME type from magic bytes."""
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return "image/gif"
    return "image/png"


def _extract_png_dimensions(data: bytes) -> Tuple[Optional[int], Optional[int]]:
    """Read width/height from a PNG IHDR chunk, if present."""
    try:
        if data[:8] == b"\x89PNG\r\n\x1a\n" and data[12:16] == b"IHDR":
            width = int.from_bytes(data[16:20], "big")
            height = int.from_bytes(data[20:24], "big")
            return width, height
    except Exception:  # pragma: no cover - defensive
        pass
    return None, None


def _raise_for_status(resp: "httpx.Response") -> None:
    """Translate a non-2xx provider response into a safe ProviderError.

    Provider responses are untrusted: nothing from the response body is ever
    sent to the client. Extracted detail is written to server logs only
    (truncated), and authentication/permission/endpoint failures are
    surfaced as a generic upstream error so the frontend never learns
    internal provider configuration. Client-actionable statuses the provider
    can meaningfully trigger (429 rate limiting) keep their specific response.
    """
    status = resp.status_code
    detail = ""
    try:
        body = resp.json()
        if isinstance(body, dict):
            err = body.get("error")
            if isinstance(err, dict):
                detail = str(err.get("message", ""))
            if not detail:
                detail = str(body.get("message", ""))
    except Exception:
        detail = resp.text[:200]

    # Diagnostics for operators only: truncated, never sent to the client,
    # and never includes request headers (no Authorization values are logged).
    logger.error(
        "Provider error: status=%s detail=%s", status, detail[:200]
    )

    if status == 429:
        raise ProviderError(
            "Rate limit reached at the image provider. Please wait a moment and try again.",
            status_code=429,
            provider_status=status,
        )

    # Everything else — including 401/403/404 configuration failures,
    # provider-supplied messages, and non-JSON error bodies — is reported as
    # a generic upstream failure. See module docstring for the trust model.
    raise ProviderError(
        "The image provider encountered an error. Please try again later.",
        status_code=502,
        provider_status=status,
    )


def _parse_response(data: Any) -> List[Dict[str, Any]]:
    """Normalize a provider response into a list of safe image dicts.

    Handles both `b64_json` and `url` response items. Base64 payloads are
    validated and converted into browser-usable data URLs. Returns an empty
    list only if no usable image is found (caller raises in that case).
    """
    if not isinstance(data, dict):
        raise ProviderError(
            "Malformed provider response: expected a JSON object.",
            status_code=502,
        )

    items = data.get("data")
    if not isinstance(items, list) or not items:
        raise ProviderError(
            "Malformed provider response: no image data was returned.",
            status_code=502,
        )

    images: List[Dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue

        b64 = item.get("b64_json")
        url = item.get("url")

        if b64:
            try:
                raw = base64.b64decode(b64, validate=True)
            except (binascii.Error, ValueError):
                logger.warning("Provider returned invalid base64 image data; skipping item.")
                continue
            if not raw:
                logger.warning("Provider returned empty image data; skipping item.")
                continue
            mime = _detect_image_mime(raw)
            width, height = _extract_png_dimensions(raw)
            data_url = f"data:{mime};base64,{b64}"
            images.append(
                {"url": data_url, "mime_type": mime, "width": width, "height": height}
            )
        elif url and isinstance(url, str) and url.startswith(("http://", "https://")):
            images.append(
                {
                    "url": url,
                    "mime_type": item.get("mime_type"),
                    "width": item.get("width"),
                    "height": item.get("height"),
                }
            )

    if not images:
        raise ProviderError(
            "The provider returned no usable image data.",
            status_code=502,
        )
    return images


async def _request_single_image(
    url: str,
    headers: Dict[str, str],
    prompt: str,
    size: str,
    prompt_extend: bool,
    watermark: bool,
) -> List[Dict[str, Any]]:
    """Issue one provider request for a single image and normalize the result.

    The provider only supports one image per request, so ``n`` is always 1.
    Uses the shared async client so a slow provider response does not block the
    event loop (and therefore unrelated requests such as /api/health).
    """
    payload = {
        "model": SENSENOVA_IMAGE_MODEL,
        "prompt": prompt,
        "size": size,
        "n": 1,
        "response_format": "b64_json",
        "watermark": watermark,
        "prompt_extend": prompt_extend,
    }

    logger.info(
        "Requesting image generation (model=%s, size=%s, n=1)",
        SENSENOVA_IMAGE_MODEL,
        size,
    )

    try:
        resp = await _get_client().post(
            url, json=payload, headers=headers, timeout=REQUEST_TIMEOUT
        )
    except httpx.TimeoutException:
        logger.error("Provider request timed out after %ss", REQUEST_TIMEOUT)
        raise ProviderError(
            "The image provider took too long to respond. Please try again.",
            status_code=504,
        )
    except httpx.RequestError as exc:
        logger.error("Provider network error: %s", type(exc).__name__)
        raise ProviderError(
            "Could not reach the image provider. Check your network connection.",
            status_code=502,
        )

    if resp.status_code != 200:
        _raise_for_status(resp)

    try:
        body = resp.json()
    except ValueError:
        # Covers json.JSONDecodeError (invalid JSON) and empty/unparseable
        # bodies. The raw body is deliberately excluded from the log and the
        # error so no provider content or credentials can reach the client.
        logger.error(
            "Provider returned a %s response with an unparseable body.",
            resp.status_code,
        )
        raise ProviderError(
            "The image provider returned an invalid response. Please try again later.",
            status_code=502,
            provider_status=resp.status_code,
        ) from None

    return _parse_response(body)


async def generate_images(
    prompt: str,
    size: str,
    n: int,
    prompt_extend: bool,
    watermark: bool,
) -> List[Dict[str, Any]]:
    """Generate ``n`` images via the SenseNova provider.

    The provider accepts only one image per request, so ``n`` images are
    produced by issuing ``n`` single-image requests and combining their
    results. Requests run with bounded concurrency (``MAX_PROVIDER_CONCURRENCY``).
    If any request fails, its ``ProviderError`` propagates unchanged so the
    caller never silently receives fewer images than requested.
    """
    if not SENSENOVA_API_KEY:
        raise ProviderError(
            "The server is missing the SenseNova API key. Configure SENSENOVA_API_KEY.",
            status_code=500,
        )

    url = f"{SENSENOVA_BASE_URL}{SENSENOVA_IMAGE_ENDPOINT}"
    headers = {
        "Authorization": f"Bearer {SENSENOVA_API_KEY}",
        "Content-Type": "application/json",
    }

    semaphore = asyncio.Semaphore(MAX_PROVIDER_CONCURRENCY)

    async def run_one() -> List[Dict[str, Any]]:
        async with semaphore:
            return await _request_single_image(
                url, headers, prompt, size, prompt_extend, watermark
            )

    batches = await asyncio.gather(*(run_one() for _ in range(n)))
    return [image for batch in batches for image in batch]
