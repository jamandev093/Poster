from __future__ import annotations

from fastapi import APIRouter

from app.core.config import load_settings
from app.models.health import HealthResponse


router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    settings = load_settings()

    return HealthResponse(
        service=settings.service_name,
        status="ok",
        version=settings.service_version,
        environment=settings.environment,
        provider=settings.provider_name,
        model=settings.model_name,
        autoLearningEnabled=settings.auto_learning_enabled,
        trainingMinEvents=settings.training_min_events,
        modelPromotionRequiresEvalPass=settings.model_promotion_requires_eval_pass,
    )
