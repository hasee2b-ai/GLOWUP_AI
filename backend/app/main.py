"""GlowUp AI backend application entry point."""
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import BACKEND_HOST, BACKEND_PORT, FRONTEND_ORIGINS, MAX_REQUEST_SIZE
from .routes import generation

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("glowup")

app = FastAPI(
    title="GlowUp AI",
    version="1.0.0",
    description="Premium AI image-generation platform backend.",
)

# Narrow CORS: only the configured frontend origins are allowed
# (FRONTEND_ORIGIN env var, comma-separated; defaults to localhost in dev).
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(generation.router)


@app.exception_handler(RequestValidationError)
async def _validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return validation failures as a string ``detail``.

    FastAPI's default body-validation error uses a list of errors, but the
    frontend's error parser only understands a string ``detail`` (and expects
    400 for malformed JSON). Preserve that contract.
    """
    errors = exc.errors()
    status_code = 422
    detail = "Invalid request."
    if errors:
        err = errors[0]
        loc = err.get("loc") or []
        field = loc[-1] if loc else ""
        err_type = err.get("type", "")
        if err_type in ("json_invalid", "json_decode"):
            status_code = 400
            detail = "Invalid JSON body."
        elif field == "prompt":
            if err_type in ("missing", "string_too_short"):
                detail = "Prompt must not be empty."
            else:
                detail = _clean_validation_message(err.get("msg", "Prompt is invalid."))
        elif field == "size":
            detail = _clean_validation_message(err.get("msg", "Unsupported size."))
        elif field == "n":
            detail = _clean_validation_message(err.get("msg", "Invalid image count."))
        else:
            detail = _clean_validation_message(err.get("msg", "Invalid request."))
    return JSONResponse(status_code=status_code, content={"detail": detail})


def _clean_validation_message(msg):
    if isinstance(msg, str) and msg.startswith("Value error, "):
        return msg[len("Value error, "):]
    return msg


@app.middleware("http")
async def limit_request_size(request, call_next):
    """Reject request bodies larger than MAX_REQUEST_SIZE."""
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_REQUEST_SIZE:
        return JSONResponse(
            status_code=413,
            content={"detail": "Request body too large."},
        )
    return await call_next(request)


@app.on_event("startup")
def _log_startup() -> None:
    from .config import SENSENOVA_API_KEY

    logger.info(
        "GlowUp AI backend starting on %s:%s (provider configured: %s)",
        BACKEND_HOST,
        BACKEND_PORT,
        bool(SENSENOVA_API_KEY),
    )


@app.on_event("shutdown")
async def _close_provider_client() -> None:
    """Release the shared SenseNova HTTP client's connections on shutdown."""
    from .services.sensenova import close_client

    await close_client()


def run() -> None:
    """Run the development server with uvicorn."""
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=BACKEND_HOST,
        port=BACKEND_PORT,
        reload=True,
    )


if __name__ == "__main__":
    run()
