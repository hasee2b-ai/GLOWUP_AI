"""Server-side configuration for GlowUp AI.

All values are read from environment variables (see .env.example).
Secrets are never hardcoded and never exposed to the frontend.
"""
import os

from dotenv import load_dotenv

load_dotenv()

# --- SenseNova provider configuration -------------------------------------
SENSENOVA_API_KEY = os.getenv("SENSENOVA_API_KEY", "")
SENSENOVA_BASE_URL = os.getenv("SENSENOVA_BASE_URL", "https://token.sensenova.ai/v1").rstrip("/")
SENSENOVA_IMAGE_MODEL = os.getenv("SENSENOVA_IMAGE_MODEL", "sensenova-u1.5-lite")
SENSENOVA_IMAGE_ENDPOINT = os.getenv("SENSENOVA_IMAGE_ENDPOINT", "/images/generations")

# --- Server / CORS --------------------------------------------------------
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
BACKEND_HOST = os.getenv("BACKEND_HOST", "127.0.0.1")
BACKEND_PORT = int(os.getenv("BACKEND_PORT", "8000"))

# --- Generation limits ----------------------------------------------------
# Only sizes documented as supported by the provider are exposed.
SUPPORTED_SIZES = {
    "1024x1024",   # Square
    "1024x1536",   # Portrait
    "1536x1024",   # Landscape
}
MIN_IMAGES = 1
MAX_IMAGES = 4
MAX_PROMPT_LENGTH = int(os.getenv("MAX_PROMPT_LENGTH", "4000"))

# Outbound request timeout (seconds). Image generation can be slow.
REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "120"))

# Maximum accepted request body size (bytes) — 1 MB for JSON request bodies.
MAX_REQUEST_SIZE = int(os.getenv("MAX_REQUEST_SIZE", str(1 * 1024 * 1024)))

# Lightweight in-memory rate limiter settings (per client IP).
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))
RATE_LIMIT_MAX = int(os.getenv("RATE_LIMIT_MAX", "10"))
