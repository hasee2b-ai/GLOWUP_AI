"""Tests for the in-memory rate limiter in app.routes.generation.

These tests exercise ``_rate_limit`` directly with a faked clock (no real
waiting, no network) and verify that the sliding-window threshold is
preserved, that fully expired client buckets are removed instead of
accumulating, and that the bucket table is bounded at MAX_TRACKED_CLIENTS
by evicting the least-recently-active clients.
"""
import sys
from pathlib import Path
from types import SimpleNamespace as _SimpleNamespace

# Make the backend package importable when pytest is run from backend/.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.routes import generation  # noqa: E402


class FakeClock:
    """Deterministic stand-in for time.time()."""

    def __init__(self, start=1_000_000.0):
        self.now = start

    def __call__(self):
        return self.now

    def advance(self, seconds):
        self.now += seconds


def _use_fake_clock(monkeypatch, start=1_000_000.0):
    clock = FakeClock(start)
    # Replace the module-level reference only (never time.time globally).
    monkeypatch.setattr(generation, "time", _SimpleNamespace(time=clock))
    # Reset the sweep throttle so fake-clock tests start deterministic.
    monkeypatch.setattr(generation, "_last_sweep", 0.0)
    return clock


# --- Sliding-window threshold is preserved ---------------------------------


def test_allows_up_to_rate_limit_max_then_blocks(monkeypatch):
    monkeypatch.setattr(generation, "_rate_buckets", {})
    monkeypatch.setattr(generation, "RATE_LIMIT_MAX", 3)
    _use_fake_clock(monkeypatch)

    assert [generation._rate_limit("ip-a") for _ in range(3)] == [True, True, True]
    assert generation._rate_limit("ip-a") is False


def test_limit_is_per_client(monkeypatch):
    monkeypatch.setattr(generation, "_rate_buckets", {})
    monkeypatch.setattr(generation, "RATE_LIMIT_MAX", 2)
    _use_fake_clock(monkeypatch)

    assert generation._rate_limit("ip-a") is True
    assert generation._rate_limit("ip-a") is True
    assert generation._rate_limit("ip-a") is False
    # A different client is not affected by ip-a's bucket.
    assert generation._rate_limit("ip-b") is True


def test_window_expiry_frees_capacity(monkeypatch):
    monkeypatch.setattr(generation, "_rate_buckets", {})
    monkeypatch.setattr(generation, "RATE_LIMIT_MAX", 2)
    clock = _use_fake_clock(monkeypatch)
    monkeypatch.setattr(generation, "RATE_LIMIT_WINDOW", 60)

    assert generation._rate_limit("ip-a") is True
    assert generation._rate_limit("ip-a") is True
    assert generation._rate_limit("ip-a") is False
    clock.advance(61)  # move past the window
    assert generation._rate_limit("ip-a") is True


# --- Bucket cleanup ---------------------------------------------------------


def test_fully_expired_bucket_is_removed(monkeypatch):
    monkeypatch.setattr(generation, "_rate_buckets", {})
    clock = _use_fake_clock(monkeypatch)
    monkeypatch.setattr(generation, "RATE_LIMIT_WINDOW", 60)

    assert generation._rate_limit("ip-a") is True
    assert "ip-a" in generation._rate_buckets

    clock.advance(61)
    # Any next call (here for another client) sweeps ip-a's expired bucket.
    assert generation._rate_limit("ip-b") is True
    assert "ip-a" not in generation._rate_buckets
    assert "ip-b" in generation._rate_buckets


def test_recently_active_bucket_is_kept(monkeypatch):
    monkeypatch.setattr(generation, "_rate_buckets", {})
    _use_fake_clock(monkeypatch)
    monkeypatch.setattr(generation, "RATE_LIMIT_WINDOW", 60)

    assert generation._rate_limit("ip-a") is True
    assert generation._rate_limit("ip-b") is True
    # ip-a's timestamp is still inside the window, so it must survive the sweep.
    assert "ip-a" in generation._rate_buckets


# --- Bounded table size -----------------------------------------------------


def test_table_is_bounded_by_evicting_least_recent(monkeypatch):
    monkeypatch.setattr(generation, "_rate_buckets", {})
    monkeypatch.setattr(generation, "MAX_TRACKED_CLIENTS", 3)
    clock = _use_fake_clock(monkeypatch)

    for i in range(3):
        assert generation._rate_limit(f"ip-{i}") is True
        clock.advance(1)
    assert len(generation._rate_buckets) == 3

    # Adding a fourth client must not grow the table past the cap.
    assert generation._rate_limit("ip-3") is True
    assert len(generation._rate_buckets) == 3
    # The least-recently-active client (ip-0) was evicted.
    assert "ip-0" not in generation._rate_buckets
    assert "ip-3" in generation._rate_buckets


def test_active_clients_are_not_evicted_before_idle_ones(monkeypatch):
    monkeypatch.setattr(generation, "_rate_buckets", {})
    monkeypatch.setattr(generation, "MAX_TRACKED_CLIENTS", 2)
    monkeypatch.setattr(generation, "RATE_LIMIT_WINDOW", 60)
    clock = _use_fake_clock(monkeypatch)

    generation._rate_limit("ip-idle")
    clock.advance(61)  # ip-idle is now outside the window
    generation._rate_limit("ip-active")
    clock.advance(1)

    # Capacity reached: the sweep must drop the idle client first.
    assert generation._rate_limit("ip-new") is True
    assert "ip-idle" not in generation._rate_buckets
    assert "ip-active" in generation._rate_buckets
    assert "ip-new" in generation._rate_buckets


# --- Image-weighted accounting (cost = requested image count) ---------------


def test_n1_consumes_one_image_slot(monkeypatch):
    """A request for 1 image costs exactly 1 slot."""
    monkeypatch.setattr(generation, "_rate_buckets", {})
    monkeypatch.setattr(generation, "RATE_LIMIT_MAX", 3)
    _use_fake_clock(monkeypatch)

    assert generation._rate_limit("ip-a", cost=1) is True
    assert len(generation._rate_buckets["ip-a"]) == 1


def test_n2_consumes_two_image_slots(monkeypatch):
    """A request for 2 images costs exactly 2 slots."""
    monkeypatch.setattr(generation, "_rate_buckets", {})
    monkeypatch.setattr(generation, "RATE_LIMIT_MAX", 3)
    _use_fake_clock(monkeypatch)

    assert generation._rate_limit("ip-a", cost=2) is True
    assert len(generation._rate_buckets["ip-a"]) == 2
    # One slot of the window remains: a single-image request still fits.
    assert generation._rate_limit("ip-a", cost=1) is True
    assert len(generation._rate_buckets["ip-a"]) == 3
    # Window is now full.
    assert generation._rate_limit("ip-a", cost=1) is False
    assert len(generation._rate_buckets["ip-a"]) == 3


def test_request_exceeding_configured_limit_is_rejected(monkeypatch):
    """A cost that would push the window past the limit is rejected."""
    monkeypatch.setattr(generation, "_rate_buckets", {})
    monkeypatch.setattr(generation, "RATE_LIMIT_MAX", 3)
    _use_fake_clock(monkeypatch)

    assert generation._rate_limit("ip-a", cost=2) is True  # 2 of 3 used
    # 2 used + 2 requested = 4 > 3: rejected even though a slot-based
    # check with cost=1 would have allowed it.
    assert generation._rate_limit("ip-a", cost=2) is False
    # The rejection consumed nothing, so the one remaining slot still fits
    # a single-image request — and only then is the window full.
    assert generation._rate_limit("ip-a", cost=1) is True
    assert generation._rate_limit("ip-a", cost=1) is False  # window full


def test_rejected_request_does_not_corrupt_accounting(monkeypatch):
    """A rejected attempt records nothing: bucket and capacity unchanged."""
    monkeypatch.setattr(generation, "_rate_buckets", {})
    monkeypatch.setattr(generation, "RATE_LIMIT_MAX", 3)
    clock = _use_fake_clock(monkeypatch)

    assert generation._rate_limit("ip-a", cost=2) is True
    before = list(generation._rate_buckets["ip-a"])
    assert len(before) == 2

    # Rejected multi-image attempt: state must be byte-for-byte identical.
    assert generation._rate_limit("ip-a", cost=2) is False
    assert generation._rate_buckets["ip-a"] == before

    # The remaining 1 slot of capacity is still usable afterwards.
    assert generation._rate_limit("ip-a", cost=1) is True
    assert len(generation._rate_buckets["ip-a"]) == 3

    # Rejection on a full window also leaves state untouched.
    full = list(generation._rate_buckets["ip-a"])
    assert generation._rate_limit("ip-a", cost=1) is False
    assert generation._rate_buckets["ip-a"] == full
    # ...and the next window opens with clean capacity.
    clock.advance(61)
    assert generation._rate_limit("ip-a", cost=2) is True
    assert len(generation._rate_buckets["ip-a"]) == 2


def test_rejected_new_client_leaves_no_empty_bucket(monkeypatch):
    """A first-ever request too large for the whole limit leaves no state."""
    monkeypatch.setattr(generation, "_rate_buckets", {})
    monkeypatch.setattr(generation, "RATE_LIMIT_MAX", 1)
    _use_fake_clock(monkeypatch)

    assert generation._rate_limit("ip-a", cost=2) is False
    assert generation._rate_buckets == {}


def test_window_expiry_after_weighted_usage(monkeypatch):
    """Weighted entries expire with the window exactly like single ones."""
    monkeypatch.setattr(generation, "_rate_buckets", {})
    monkeypatch.setattr(generation, "RATE_LIMIT_MAX", 3)
    monkeypatch.setattr(generation, "RATE_LIMIT_WINDOW", 60)
    clock = _use_fake_clock(monkeypatch)

    assert generation._rate_limit("ip-a", cost=2) is True
    assert generation._rate_limit("ip-a", cost=2) is False  # 2 + 2 > 3

    clock.advance(61)  # both timestamps are outside the window
    assert generation._rate_limit("ip-a", cost=2) is True
    assert len(generation._rate_buckets["ip-a"]) == 2  # fresh window


def test_default_cost_ignores_unspecified_requests(monkeypatch):
    """Calls without an explicit cost behave exactly as before (cost=1)."""
    monkeypatch.setattr(generation, "_rate_buckets", {})
    monkeypatch.setattr(generation, "RATE_LIMIT_MAX", 2)
    _use_fake_clock(monkeypatch)

    assert generation._rate_limit("ip-a") is True
    assert generation._rate_limit("ip-a") is True
    assert generation._rate_limit("ip-a") is False
    assert len(generation._rate_buckets["ip-a"]) == 2


# --- Route: /api/generate passes the validated n to the limiter ------------


def _fake_provider(n):
    return [
        {"url": f"data:image/png;base64,IMG{i}", "mime_type": "image/png"}
        for i in range(n)
    ]


def test_route_charges_validated_n_to_limiter(monkeypatch):
    """The endpoint must hand payload.n to the limiter, not a constant 1."""
    import asyncio
    from types import SimpleNamespace

    from app.schemas import GenerateRequest

    charges = []

    def recording_rate_limit(key, cost=1):
        charges.append((key, cost))
        return True

    async def fake_generate_images(prompt, size, n, prompt_extend, watermark):
        return _fake_provider(n)

    monkeypatch.setattr(generation, "_rate_limit", recording_rate_limit)
    monkeypatch.setattr(generation, "generate_images", fake_generate_images)

    req = SimpleNamespace(client=SimpleNamespace(host="203.0.113.9"))
    payload = GenerateRequest(prompt="a cat", n=2)

    response = asyncio.run(generation.generate(req, payload))

    # The limiter was charged in images for the validated n.
    assert charges == [("203.0.113.9", 2)]
    assert response.success is True
    assert len(response.images) == 2


def test_route_rejected_request_is_429_and_never_calls_provider(monkeypatch):
    """A limiter rejection surfaces as 429 with the unchanged detail message
    and no provider call — so rejected requests cannot spend capacity."""
    import asyncio
    from types import SimpleNamespace

    import pytest as _pytest
    from fastapi import HTTPException

    from app.schemas import GenerateRequest

    async def provider_must_not_run(prompt, size, n, prompt_extend, watermark):
        raise AssertionError("provider must not be called on rejection")

    monkeypatch.setattr(generation, "_rate_limit", lambda key, cost=1: False)
    monkeypatch.setattr(generation, "generate_images", provider_must_not_run)

    req = SimpleNamespace(client=SimpleNamespace(host="203.0.113.9"))
    payload = GenerateRequest(prompt="a cat", n=2)

    with _pytest.raises(HTTPException) as excinfo:
        asyncio.run(generation.generate(req, payload))

    assert excinfo.value.status_code == 429
    # Response contract preserved: same detail string as before the change.
    assert (
        excinfo.value.detail
        == "Too many requests. Please slow down and try again shortly."
    )
