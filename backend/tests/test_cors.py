"""Tests for CORS origin configuration.

These tests reload ``app.config`` under controlled environment variables to
verify that ``FRONTEND_ORIGINS`` is parsed from the comma-separated
``FRONTEND_ORIGIN`` setting and that an unset/empty value falls back to the
local dev origin — never to the wildcard "*" origin. No real credentials are
read or required.
"""
import importlib
import sys
from pathlib import Path

import pytest

# Make the backend package importable when pytest is run from backend/.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import config  # noqa: E402


def _reload_origins(monkeypatch, value):
    """Reload config with FRONTEND_ORIGIN set to ``value`` (None = unset)."""
    if value is None:
        monkeypatch.delenv("FRONTEND_ORIGIN", raising=False)
    else:
        monkeypatch.setenv("FRONTEND_ORIGIN", value)
    reloaded = importlib.reload(config)
    return reloaded.FRONTEND_ORIGINS


@pytest.fixture(autouse=True)
def _restore_config():
    """Reload config with a clean environment after each test."""
    yield
    import os

    os.environ.pop("FRONTEND_ORIGIN", None)
    importlib.reload(config)


def test_single_origin_parsed(monkeypatch):
    origins = _reload_origins(monkeypatch, "https://app.example.com")
    assert origins == ["https://app.example.com"]


def test_multiple_comma_separated_origins_parsed(monkeypatch):
    origins = _reload_origins(
        monkeypatch,
        "https://app.example.com, http://localhost:5173 ,",
    )
    assert origins == ["https://app.example.com", "http://localhost:5173"]


def test_whitespace_and_empty_entries_are_ignored(monkeypatch):
    origins = _reload_origins(monkeypatch, "  , ,http://localhost:5173,, ")
    assert origins == ["http://localhost:5173"]


def test_unset_falls_back_to_localhost_not_wildcard(monkeypatch):
    origins = _reload_origins(monkeypatch, None)
    assert origins == ["http://localhost:5173"]
    assert "*" not in origins


def test_empty_value_falls_back_to_localhost_not_wildcard(monkeypatch):
    origins = _reload_origins(monkeypatch, "   ,  ")
    assert origins == ["http://localhost:5173"]
    assert "*" not in origins


def test_app_uses_parsed_origins(monkeypatch):
    """The FastAPI app's CORS middleware uses the parsed origin list."""
    _reload_origins(monkeypatch, "https://a.example,https://b.example")
    import app.main

    main = importlib.reload(app.main)
    cors = next(
        m for m in main.app.user_middleware if m.cls.__name__ == "CORSMiddleware"
    )
    assert cors.kwargs["allow_origins"] == ["https://a.example", "https://b.example"]
    assert "*" not in cors.kwargs["allow_origins"]
