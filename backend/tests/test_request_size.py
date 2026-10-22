"""Tests for the request-body size middleware (app.main.BodySizeLimitMiddleware).

These tests drive the FastAPI/ASGI app directly with crafted ASGI messages —
no real network, no waiting, and no external services. The provider is
monkeypatched so a valid small POST never calls SenseNova. They verify that:

- a normal small request passes through unchanged (200),
- an oversized body is rejected with 413 whether the size is declared via
  Content-Length or streamed without one,
- a missing Content-Length (chunked-style stream) is still size-capped,
- a malformed or negative Content-Length returns 400, never a 500.
"""
import asyncio
import json
import sys
from pathlib import Path

import pytest

# Make the backend package importable when pytest is run from backend/.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import MAX_REQUEST_SIZE, app  # noqa: E402
from app.routes import generation  # noqa: E402

# A valid small JSON body for POST /api/generate.
SMALL_BODY = json.dumps(
    {"prompt": "a cat", "size": "1024x1024", "n": 1, "prompt_extend": True, "watermark": True}
).encode()
JSON_HEADERS = [("Content-Type", "application/json")]


def _scope(path="/api/generate", method="POST", headers=None):
    header_list = [(k.lower().encode(), v.encode()) for k, v in (headers or [])]
    return {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": method,
        "scheme": "http",
        "path": path,
        "raw_path": path.encode(),
        "query_string": b"",
        "root_path": "",
        "headers": header_list,
        "client": ("127.0.0.1", 12345),
        "server": ("testserver", 80),
    }


def _body_messages(payload: bytes, chunk_size=None):
    """Build the ASGI http.request messages for ``payload``.

    With ``chunk_size`` the body is split across several messages with
    more_body=True (streamed / no Content-Length semantics).
    """
    if chunk_size is None:
        return [{"type": "http.request", "body": payload, "more_body": False}]
    messages = []
    for start in range(0, len(payload), chunk_size):
        messages.append(
            {
                "type": "http.request",
                "body": payload[start : start + chunk_size],
                "more_body": True,
            }
        )
    messages.append({"type": "http.request", "body": b"", "more_body": False})
    return messages


async def _call_app(scope, incoming):
    """Run the ASGI app; return (status, raw_headers, body_bytes)."""
    queue = list(incoming)
    sent = []

    async def receive():
        if queue:
            return queue.pop(0)
        return {"type": "http.disconnect"}

    async def send(message):
        sent.append(message)

    await app(scope, receive, send)

    start = next(m for m in sent if m["type"] == "http.response.start")
    body = b"".join(
        m.get("body", b"") for m in sent if m["type"] == "http.response.body"
    )
    return start["status"], start["headers"], body


def _run(scope, incoming):
    return asyncio.run(_call_app(scope, incoming))


@pytest.fixture(autouse=True)
def _stub_provider(monkeypatch):
    """Never call the real provider; also isolate the rate limiter."""

    async def fake_generate_images(prompt, size, n, prompt_extend, watermark):
        return [
            {
                "url": "data:image/png;base64,iVBORw0KGgo=",
                "mime_type": "image/png",
                "width": 1,
                "height": 1,
            }
            for _ in range(n)
        ]

    monkeypatch.setattr(generation, "generate_images", fake_generate_images)
    monkeypatch.setattr(generation, "_rate_buckets", {})


# --- Normal small request passes through -----------------------------------


def test_small_request_with_content_length_succeeds():
    scope = _scope(headers=JSON_HEADERS + [("Content-Length", str(len(SMALL_BODY)))])
    status, _, body = _run(scope, _body_messages(SMALL_BODY))
    assert status == 200
    assert json.loads(body)["success"] is True


def test_health_get_without_body_still_works():
    scope = _scope(path="/api/health", method="GET")
    status, _, body = _run(scope, _body_messages(b""))
    assert status == 200
    assert json.loads(body)["status"] == "ok"


# --- Oversized declared via Content-Length ---------------------------------


def test_oversized_declared_content_length_is_413():
    oversized = MAX_REQUEST_SIZE + 1
    scope = _scope(headers=[("Content-Length", str(oversized))])
    status, _, body = _run(scope, _body_messages(b"x" * oversized))
    assert status == 413
    assert json.loads(body)["detail"] == "Request body too large."


# --- Missing Content-Length (streamed body) --------------------------------


def test_streamed_body_without_content_length_within_limit_succeeds():
    scope = _scope(headers=JSON_HEADERS)
    status, _, _ = _run(scope, _body_messages(SMALL_BODY, chunk_size=16))
    assert status == 200


def test_streamed_body_without_content_length_over_limit_is_413():
    oversized = MAX_REQUEST_SIZE + 1024
    scope = _scope()
    status, _, body = _run(scope, _body_messages(b"y" * oversized, chunk_size=4096))
    assert status == 413
    assert json.loads(body)["detail"] == "Request body too large."


# --- Malformed / invalid Content-Length ------------------------------------


@pytest.mark.parametrize("bad_value", ["not-a-number", "-1", "1; 2", ""])
def test_malformed_content_length_is_400_not_500(bad_value):
    scope = _scope(headers=[("Content-Length", bad_value)])
    status, _, body = _run(scope, _body_messages(SMALL_BODY))
    assert status == 400
    detail = json.loads(body)["detail"]
    assert "Content-Length" in detail
