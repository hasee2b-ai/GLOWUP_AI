"""Tests for the SenseNova provider service.

These tests mock the outbound HTTP client entirely: no real SenseNova API calls
are made and no real credentials are required. They verify that the service
fans out multiple requested images into single-image provider requests, keeps
concurrency bounded, and propagates provider failures safely.
"""
import asyncio
import inspect
import json
import sys
from pathlib import Path

import httpx
import pytest
from pydantic import ValidationError

# Make the backend package importable when pytest is run from backend/.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.schemas import GenerateRequest  # noqa: E402
from app.services import sensenova  # noqa: E402

# A valid 1x1 PNG (base64) so response normalization has real image bytes.
PNG_B64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


class FakeResponse:
    def __init__(self, status_code=200, payload=None, text=""):
        self.status_code = status_code
        self._payload = payload
        self.text = text

    def json(self):
        if isinstance(self._payload, Exception):
            raise self._payload
        return self._payload


def _ok_payload():
    return {"data": [{"b64_json": PNG_B64}]}


class FakeClient:
    """Records provider calls and replies via a queued handler."""

    def __init__(self, handler):
        self._handler = handler
        self.calls = []

    async def post(self, url, json=None, headers=None, timeout=None):
        self.calls.append(
            {"url": url, "json": json, "headers": headers, "timeout": timeout}
        )
        result = self._handler(len(self.calls), json)
        if inspect.isawaitable(result):
            result = await result
        return result


@pytest.fixture(autouse=True)
def _fake_key(monkeypatch):
    """Use a non-secret placeholder key so no real credential can leak."""
    monkeypatch.setattr(sensenova, "SENSENOVA_API_KEY", "test-key-not-secret")
    yield


def _run(coro):
    return asyncio.run(coro)


# --- Single-image behavior is preserved ------------------------------------


def test_n1_makes_one_request_with_n1(monkeypatch):
    client = FakeClient(lambda i, payload: FakeResponse(200, _ok_payload()))
    monkeypatch.setattr(sensenova, "_get_client", lambda: client)

    images = _run(sensenova.generate_images("a cat", "1024x1024", 1, True, True))

    assert len(client.calls) == 1
    sent = client.calls[0]["json"]
    assert sent["n"] == 1
    assert sent["prompt"] == "a cat"
    assert sent["size"] == "1024x1024"
    assert sent["prompt_extend"] is True
    assert sent["watermark"] is True
    assert sent["response_format"] == "b64_json"
    assert len(images) == 1
    assert images[0]["mime_type"] == "image/png"


# --- Two-image fan-out ------------------------------------------------------


def test_n2_makes_two_requests_with_n1_and_combines(monkeypatch):
    client = FakeClient(lambda i, payload: FakeResponse(200, _ok_payload()))
    monkeypatch.setattr(sensenova, "_get_client", lambda: client)

    images = _run(sensenova.generate_images("a dog", "1024x1536", 2, False, False))

    assert len(client.calls) == 2
    assert all(call["json"]["n"] == 1 for call in client.calls)
    assert all(call["json"]["prompt"] == "a dog" for call in client.calls)
    assert all(call["json"]["prompt_extend"] is False for call in client.calls)
    assert all(call["json"]["watermark"] is False for call in client.calls)
    assert len(images) == 2
    assert all(img["mime_type"] == "image/png" for img in images)


def test_concurrency_is_bounded(monkeypatch):
    in_flight = 0
    max_in_flight = 0

    async def handler(i, payload):
        nonlocal in_flight, max_in_flight
        in_flight += 1
        max_in_flight = max(max_in_flight, in_flight)
        await asyncio.sleep(0.01)
        in_flight -= 1
        return FakeResponse(200, _ok_payload())

    client = FakeClient(handler)
    monkeypatch.setattr(sensenova, "_get_client", lambda: client)

    # n=4 here exercises the internal fan-out cap; request validation rejects
    # n>2 at the API boundary (covered by the schema tests below).
    images = _run(sensenova.generate_images("a bird", "1024x1024", 4, True, True))

    assert sensenova.MAX_PROVIDER_CONCURRENCY == 2
    assert max_in_flight <= 2
    assert len(client.calls) == 4
    assert len(images) == 4


# --- Failures propagate safely ---------------------------------------------


def test_provider_error_propagates(monkeypatch):
    def handler(i, payload):
        if i == 2:
            return FakeResponse(
                400, {"error": {"message": "invalid n, should be in [1, 1]"}}
            )
        return FakeResponse(200, _ok_payload())

    client = FakeClient(handler)
    monkeypatch.setattr(sensenova, "_get_client", lambda: client)

    with pytest.raises(sensenova.ProviderError) as excinfo:
        _run(sensenova.generate_images("a bird", "1024x1024", 2, True, True))

    # Provider-supplied text must NOT reach the client; only the generic
    # upstream message does (provider_status keeps it diagnosable server-side).
    assert "invalid n" not in str(excinfo.value.message)
    assert excinfo.value.status_code == 502
    assert excinfo.value.provider_status == 400


# --- Upstream errors are sanitized before reaching the frontend -------------


@pytest.mark.parametrize("provider_status", [401, 403, 404])
def test_config_failures_are_generic_502(monkeypatch, provider_status):
    """Provider 401/403/404 must not reveal setup details to the frontend."""
    leaky_detail = (
        "invalid api key: sk-abc123 ... check your account config at https://..."
    )
    client = FakeClient(
        lambda i, payload: FakeResponse(
            provider_status, {"error": {"message": leaky_detail}}
        )
    )
    monkeypatch.setattr(sensenova, "_get_client", lambda: client)

    with pytest.raises(sensenova.ProviderError) as excinfo:
        _run(sensenova.generate_images("a cat", "1024x1024", 1, True, True))

    assert excinfo.value.status_code == 502
    assert excinfo.value.provider_status == provider_status
    assert leaky_detail not in excinfo.value.message
    # No internal setup hints in the client-facing message.
    for hint in ("api key", "API key", "endpoint", "model", "account"):
        assert hint not in excinfo.value.message


def test_non_json_error_body_is_not_leaked(monkeypatch):
    body = "<html>502 Bad Gateway <pre>internal stacktrace sk-leak</pre></html>"
    client = FakeClient(
        lambda i, payload: FakeResponse(
            500, json.JSONDecodeError("Expecting value", body, 0), text=body
        )
    )
    monkeypatch.setattr(sensenova, "_get_client", lambda: client)

    with pytest.raises(sensenova.ProviderError) as excinfo:
        _run(sensenova.generate_images("a cat", "1024x1024", 1, True, True))

    assert excinfo.value.status_code == 502
    assert body not in excinfo.value.message


def test_provider_429_keeps_specific_client_message(monkeypatch):
    """Known, client-actionable provider rate limit stays specific."""
    client = FakeClient(
        lambda i, payload: FakeResponse(429, {"error": {"message": "slow down"}})
    )
    monkeypatch.setattr(sensenova, "_get_client", lambda: client)

    with pytest.raises(sensenova.ProviderError) as excinfo:
        _run(sensenova.generate_images("a cat", "1024x1024", 1, True, True))

    assert excinfo.value.status_code == 429
    assert "Rate limit" in excinfo.value.message
    assert "slow down" not in excinfo.value.message


def test_application_validation_errors_are_untouched():
    """Application-generated validation errors keep their specific messages."""
    with pytest.raises(ValidationError) as excinfo:
        GenerateRequest(prompt="x", n=5)
    assert "between 1 and 2" in str(excinfo.value)


def test_timeout_propagates_as_safe_error(monkeypatch):
    class TimeoutClient:
        async def post(self, *args, **kwargs):
            raise httpx.TimeoutException("boom")

    monkeypatch.setattr(sensenova, "_get_client", lambda: TimeoutClient())

    with pytest.raises(sensenova.ProviderError) as excinfo:
        _run(sensenova.generate_images("x", "1024x1024", 1, True, True))

    assert excinfo.value.status_code == 504
    assert "too long" in str(excinfo.value.message)


# --- Success responses with invalid bodies ---------------------------------


def _decode_error():
    """A realistic json.JSONDecodeError as raised by resp.json()."""
    return json.JSONDecodeError("Expecting value", "<html>oops</html>", 0)


def test_invalid_json_body_becomes_provider_error(monkeypatch):
    body = "<html>internal gateway leak</html>"
    client = FakeClient(lambda i, payload: FakeResponse(200, _decode_error(), text=body))
    monkeypatch.setattr(sensenova, "_get_client", lambda: client)

    with pytest.raises(sensenova.ProviderError) as excinfo:
        _run(sensenova.generate_images("a cat", "1024x1024", 1, True, True))

    assert excinfo.value.status_code == 502
    assert excinfo.value.provider_status == 200
    # No raw provider content may leak to the client.
    assert body not in str(excinfo.value.message)


def test_empty_body_becomes_provider_error(monkeypatch):
    client = FakeClient(lambda i, payload: FakeResponse(200, _decode_error(), text=""))
    monkeypatch.setattr(sensenova, "_get_client", lambda: client)

    with pytest.raises(sensenova.ProviderError) as excinfo:
        _run(sensenova.generate_images("a cat", "1024x1024", 1, True, True))

    assert excinfo.value.status_code == 502


def test_valid_json_still_follows_existing_path(monkeypatch):
    """Regression: a valid JSON success body parses as before."""
    client = FakeClient(lambda i, payload: FakeResponse(200, _ok_payload()))
    monkeypatch.setattr(sensenova, "_get_client", lambda: client)

    images = _run(sensenova.generate_images("a cat", "1024x1024", 1, True, True))

    assert len(images) == 1
    assert images[0]["mime_type"] == "image/png"
    assert images[0]["url"].startswith("data:image/png;base64,")


# --- Request validation -----------------------------------------------------


def test_schema_accepts_1_and_2():
    assert GenerateRequest(prompt="x", n=1).n == 1
    assert GenerateRequest(prompt="x", n=2).n == 2


@pytest.mark.parametrize("n", [0, 3, 4, 100])
def test_schema_rejects_out_of_range(n):
    with pytest.raises(ValidationError):
        GenerateRequest(prompt="x", n=n)


# --- Strict type validation (Issue #7) --------------------------------------


@pytest.mark.parametrize("bad_n", [True, False])
def test_schema_rejects_boolean_for_n(bad_n):
    with pytest.raises(ValidationError) as excinfo:
        GenerateRequest(prompt="x", n=bad_n)
    assert "not a boolean" in str(excinfo.value)


@pytest.mark.parametrize("bad_n", [1.0, 1.5, 2.0])
def test_schema_rejects_float_for_n(bad_n):
    with pytest.raises(ValidationError) as excinfo:
        GenerateRequest(prompt="x", n=bad_n)
    assert "not a float" in str(excinfo.value)


@pytest.mark.parametrize("bad_n", ["1", "2", "0", "3"])
def test_schema_rejects_string_for_n(bad_n):
    with pytest.raises(ValidationError) as excinfo:
        GenerateRequest(prompt="x", n=bad_n)
    assert "not a string" in str(excinfo.value)


@pytest.mark.parametrize("field", ["prompt_extend", "watermark"])
@pytest.mark.parametrize("bad_val", ["true", "false", "True", "False", "1", "0", "yes", "no"])
def test_schema_rejects_string_for_boolean_fields(field, bad_val):
    with pytest.raises(ValidationError) as excinfo:
        GenerateRequest(prompt="x", **{field: bad_val})
    assert "not a string" in str(excinfo.value)


def test_schema_accepts_actual_booleans():
    r = GenerateRequest(prompt="x", prompt_extend=True, watermark=False)
    assert r.prompt_extend is True
    assert r.watermark is False


def test_schema_rejects_unknown_fields():
    with pytest.raises(ValidationError) as excinfo:
        GenerateRequest(prompt="x", unknown_field="oops")
    assert "Extra inputs are not permitted" in str(excinfo.value)
    assert "unknown_field" in str(excinfo.value)
