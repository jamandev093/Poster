from __future__ import annotations

from typing import Annotated

from pydantic import BaseModel, StringConstraints


EmbeddingText = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=1,
        max_length=20000,
    ),
]


class EmbeddingRequest(BaseModel):
    text: EmbeddingText


class EmbeddingResponse(BaseModel):
    available: bool
    dimensions: int
    vector: list[float]
    provider: str
    model: str
    generatedAt: str
    reason: str | None = None