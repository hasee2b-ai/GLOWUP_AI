"""Vercel serverless entry point for the GlowUp AI FastAPI backend."""
import sys
import os

# Ensure the backend directory is on the Python path so that
# `from app.main import app` resolves correctly inside Vercel's
# serverless runtime.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app  # noqa: E402
