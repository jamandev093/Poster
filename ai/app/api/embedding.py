from __future__ import annotations

from fastapi import APIRouter

from app.core.config import load_settings
from app.models.embedding import EmbeddingRequest, EmbeddingResponse
from app.services.embedding_service import create_embedding_result


router = APIRouter(prefix="/v1", tags=["embeddings"])


@router.post("/embed", response_model=EmbeddingResponse)
async def embed(request: EmbeddingRequest) -> EmbeddingResponse:
    settings = load_settings()

    result = create_embedding_result(
        text=request.text,
        provider_name=settings.provider_name,
        model_name=settings.embedding_model_name,
    )

    return EmbeddingResponse(**result)