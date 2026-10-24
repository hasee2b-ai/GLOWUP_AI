"""GlowUp AI backend application entry point."""
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.datastructures import Headers

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
        elif err_type == "missing" and list(loc) == ["body"]:
            # An empty body (or one that parsed to ``null``) under a JSON
            # content type is reported by FastAPI as the whole body being
            # "missing" rather than a decode error. Treat it as malformed JSON
            # so clients get the same controlled 400 as other malformed bodies
            # (matching the pre-Pydantic behaviour: json.loads(b"") -> 400),
            # not a confusing 422 schema error.
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


class BodySizeLimitMiddleware:
    """ASGI middleware enforcing a cap on the request body size.

    - A valid ``Content-Length`` above the cap is rejected immediately (413).
    - A malformed or negative ``Content-Length`` is rejected as invalid (400)
      instead of crashing with a 500.
    - When ``Content-Length`` is absent or unreliable (e.g. chunked bodies),
      the body is streamed and counted, never buffering more than the cap,
      and the request is rejected as soon as the cap is exceeded.
    """

    def __init__(self, app, max_size: int):
        self.app = app
        self.max_size = max_size

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        content_length = Headers(scope=scope).get("content-length")
        if content_length is not None:
            try:
                declared = int(content_length)
            except ValueError:
                declared = -1
            if declared < 0:
                await _send_error_json(scope, send, 400, "Invalid Content-Length header.")
                return
            if declared > self.max_size:
                await _send_error_json(scope, send, 413, "Request body too large.")
                return
            await self.app(scope, receive, send)
            return

        # No usable Content-Length: read the body with a hard cap, then replay
        # the buffered bytes to the application. Buffering is bounded by the
        # cap itself, so an oversized upload never lands fully in memory.
        body = bytearray()
        while True:
            message = await receive()
            if message["type"] != "http.request":
                # e.g. http.disconnect: pass control back downstream.
                if message["type"] == "http.disconnect":
                    await self.app(scope, receive, send)
                return
            body += message.get("body", b"")
            if len(body) > self.max_size:
                await _send_error_json(scope, send, 413, "Request body too large.")
                return
            if not message.get("more_body", False):
                break

        body_bytes = bytes(body)
        delivered = False

        async def replayed_receive():
            nonlocal delivered
            if not delivered:
                delivered = True
                return {
                    "type": "http.request",
                    "body": body_bytes,
                    "more_body": False,
                }
            # Body fully delivered; further reads report disconnection, which
            # matches ASGI semantics for a spent request body.
            return {"type": "http.disconnect"}

        await self.app(scope, replayed_receive, send)


async def _send_error_json(scope, send, status_code: int, detail: str) -> None:
    """Emit a small JSON error response with the app's ``{"detail": ...}`` shape."""
    await JSONResponse(status_code=status_code, content={"detail": detail})(
        scope, None, send
    )


app.add_middleware(BodySizeLimitMiddleware, max_size=MAX_REQUEST_SIZE)


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
