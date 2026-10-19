"""GlowUp AI backend application entry point."""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import BACKEND_HOST, BACKEND_PORT, FRONTEND_ORIGIN, MAX_REQUEST_SIZE
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

# Narrow CORS: only the configured frontend origin is allowed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(generation.router)


@app.middleware("http")
async def limit_request_size(request, call_next):
    """Reject request bodies larger than MAX_REQUEST_SIZE."""
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_REQUEST_SIZE:
        from fastapi.responses import JSONResponse

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
