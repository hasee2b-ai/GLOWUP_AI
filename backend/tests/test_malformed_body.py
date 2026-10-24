"""Tests for malformed / invalid JSON body handling on POST /api/generate.

These drive the ASGI app directly (same pattern as ``test_request_size``) with
crafted bodies — no network, no real provider. They lock in the contract that a
malformed body yields a controlled, safe 400 with a fixed message and never a
5xx or an internal exception detail:

- truncated / non-JSON / whitespace-only bodies -> 400 "Invalid JSON body."
- an EMPTY body (or one that parses to ``null``) -> 400 "Invalid JSON body."
  (regression: Pydantic body validation reports this as a body-level "missing",
  which previously returned a confusing 422 schema error)
- valid JSON that fails schema validation -> unchanged 422 (preserved)
- an oversized body is still rejected by the size middleware as 413.
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


def _post(body: bytes, chunk_size=None, headers=None):
    scope = _scope(headers=headers if headers is not None else JSON_HEADERS)
    return _run(scope, _body_messages(body, chunk_size=chunk_size))


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


# --- Malformed JSON -> controlled 400 --------------------------------------


@pytest.mark.parametrize(
    "body",
    [
        b"",  # empty body
        b"   ",  # whitespace only
        b"{",  # truncated object
        b'{"prompt": "a',  # truncated value
        b"not json at all",
        b'{"prompt":"a"} extra',  # trailing garbage
        b'{"prompt": "a\nb"}',  # raw control char inside a string
    ],
)
def test_malformed_body_is_400_with_fixed_message(body):
    status, _, raw = _post(body)
    assert status == 400
    assert json.loads(raw)["detail"] == "Invalid JSON body."


def test_empty_body_is_400_not_422():
    """Regression: an empty body must not surface as a 422 schema error."""
    status, _, raw = _post(b"")
    assert status == 400
    assert json.loads(raw)["detail"] == "Invalid JSON body."


def test_null_body_is_400_not_500():
    """``null`` parses but is not a request object; must be a safe 400."""
    status, _, raw = _post(b"null")
    assert status == 400
    assert json.loads(raw)["detail"] == "Invalid JSON body."


def test_malformed_body_is_400_when_streamed_without_content_length():
    """Same 400 contract holds on the middleware's replay (chunked) path."""
    status, _, raw = _post(b'{"prompt": "a', chunk_size=8)
    assert status == 400
    assert json.loads(raw)["detail"] == "Invalid JSON body."


def test_error_body_never_leaks_exception_details():
    for body in (b"", b"not json", b"{", b"null"):
        _, _, raw = _post(body)
        text = raw.decode()
        # No traceback / class names / internals in the response.
        for leak in ("Traceback", "JSONDecodeError", "ValidationError", "Exception"):
            assert leak not in text


# --- Valid JSON that fails schema -> 422 (preserved) -----------------------


def test_missing_prompt_field_is_still_422():
    status, _, raw = _post(b'{"size": "1024x1024"}')
    assert status == 422
    assert json.loads(raw)["detail"] == "Prompt must not be empty."


def test_wrong_prompt_type_is_still_422():
    status, _, raw = _post(b'{"prompt": 123}')
    assert status == 422
    assert "valid string" in json.loads(raw)["detail"]


def test_non_object_json_is_still_422():
    status, _, raw = _post(b"[1, 2, 3]")
    assert status == 422


# --- Interaction with the size middleware: oversized stays 413 -------------


def test_oversized_body_is_still_413_not_400():
    oversized = MAX_REQUEST_SIZE + 1
    scope = _scope(headers=[("Content-Length", str(oversized))])
    status, _, raw = _run(scope, _body_messages(b"x" * oversized))
    assert status == 413
    assert json.loads(raw)["detail"] == "Request body too large."


# --- Valid request still succeeds -------------------------------------------


def test_valid_body_still_returns_200():
    valid = json.dumps({"prompt": "a cat", "size": "1024x1024", "n": 1}).encode()
    status, _, raw = _post(valid)
    assert status == 200
    assert json.loads(raw)["success"] is True
