from __future__ import annotations

from fastapi import APIRouter

from app.core.config import load_settings
from app.models.classification import ClassificationRequest, ClassificationResponse
from app.services.rule_classifier import classify_content


router = APIRouter(prefix="/v1", tags=["classification"])


@router.post("/classify", response_model=ClassificationResponse)
async def classify(request: ClassificationRequest) -> ClassificationResponse:
    settings = load_settings()

    result = classify_content(
        source_key=request.sourceKey,
        url=request.url,
        title=request.title,
        excerpt=request.excerpt,
        categories=request.categories,
        provider_name=settings.provider_name,
        model_name=settings.model_name,
    )

    return ClassificationResponse(**result)
