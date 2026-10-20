"""Pydantic request/response models for the GlowUp AI backend."""
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

from .config import MAX_IMAGES, MAX_PROMPT_LENGTH, MIN_IMAGES, SUPPORTED_SIZES


class GenerateRequest(BaseModel):
    """Validated request body for POST /api/generate.

    The schema intentionally matches only the settings the frontend exposes.
    The API key is never accepted from the browser.
    """

    # Length is enforced after trimming (in prompt_not_blank) so surrounding
    # whitespace does not count against MAX_PROMPT_LENGTH.
    prompt: str = Field(..., min_length=1)
    size: str = "1024x1024"
    n: int = 1
    prompt_extend: bool = True
    watermark: bool = True

    @field_validator("prompt")
    @classmethod
    def prompt_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Prompt must not be empty or whitespace only.")
        if len(v) > MAX_PROMPT_LENGTH:
            raise ValueError(f"Prompt exceeds {MAX_PROMPT_LENGTH} characters.")
        return v

    @field_validator("size")
    @classmethod
    def size_supported(cls, v: str) -> str:
        if v not in SUPPORTED_SIZES:
            raise ValueError(
                f"Unsupported size '{v}'. Supported sizes: {sorted(SUPPORTED_SIZES)}"
            )
        return v

    @field_validator("n")
    @classmethod
    def n_in_range(cls, v: int) -> int:
        if v < MIN_IMAGES or v > MAX_IMAGES:
            raise ValueError(
                f"Image count must be between {MIN_IMAGES} and {MAX_IMAGES}."
            )
        return v


class ImageResult(BaseModel):
    """A single normalized image result safe to send to the browser."""

    url: str
    mime_type: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None


class GenerateResponse(BaseModel):
    success: bool
    images: List[ImageResult]
    prompt: str
