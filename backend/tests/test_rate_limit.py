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
