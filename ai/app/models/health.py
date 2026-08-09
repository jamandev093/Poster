from __future__ import annotations

from pydantic import BaseModel


class HealthResponse(BaseModel):
    service: str
    status: str
    version: str
    environment: str
    provider: str
    model: str
    autoLearningEnabled: bool
    trainingMinEvents: int
    modelPromotionRequiresEvalPass: bool
