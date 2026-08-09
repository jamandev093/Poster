from __future__ import annotations

from fastapi import FastAPI

from app.api.classification import router as classification_router
from app.api.embedding import router as embedding_router
from app.api.health import router as health_router
from app.core.config import load_settings


def create_app() -> FastAPI:
    settings = load_settings()

    app = FastAPI(
        title="Poster AI Service",
        version=settings.service_version,
        description="Production AI service boundary for Poster Brain classification and future learning.",
    )

    app.include_router(health_router)
    app.include_router(classification_router)
    app.include_router(embedding_router)

    return app


app = create_app()