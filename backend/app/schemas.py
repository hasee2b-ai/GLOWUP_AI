"""Pydantic request/response models for the GlowUp AI backend."""
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .config import MAX_IMAGES, MAX_PROMPT_LENGTH, MIN_IMAGES, SUPPORTED_SIZES


class GenerateRequest(BaseModel):
    """Validated request body for POST /api/generate.

    The schema intentionally matches only the settings the frontend exposes.
    The API key is never accepted from the browser.
    """

    model_config = ConfigDict(extra="forbid")

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

    @field_validator("n", mode="before")
    @classmethod
    def n_strict_int(cls, v):
        # Reject bools explicitly (bool is subclass of int in Python)
        if isinstance(v, bool):
            raise ValueError("Image count must be an integer, not a boolean.")
        # Reject strings (including numeric strings)
        if isinstance(v, str):
            raise ValueError("Image count must be an integer, not a string.")
        # Reject floats (including whole-number floats like 1.0)
        if isinstance(v, float):
            raise ValueError("Image count must be an integer, not a float.")
        # Pydantic will coerce other types (e.g. Decimal) to int; the range
        # validator below will catch out-of-range values.
        return v

    @field_validator("n")
    @classmethod
    def n_in_range(cls, v: int) -> int:
        if v < MIN_IMAGES or v > MAX_IMAGES:
            raise ValueError(
                f"Image count must be between {MIN_IMAGES} and {MAX_IMAGES}."
            )
        return v

    @field_validator("prompt_extend", "watermark", mode="before")
    @classmethod
    def bool_strict(cls, v):
        # Only accept actual JSON booleans; reject strings like "true"/"false"
        if isinstance(v, str):
            raise ValueError("Must be a boolean (true/false), not a string.")
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
