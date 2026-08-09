from __future__ import annotations

from pydantic import BaseModel, Field


class ClassificationRequest(BaseModel):
    sourceKey: str
    url: str
    title: str
    excerpt: str | None = None
    categories: list[str] = Field(default_factory=list)
    publishedAt: str | None = None


class ClassificationResponse(BaseModel):
    primaryCategory: str
    topics: list[str]
    confidence: float
    provider: str
    model: str
    classifiedAt: str
