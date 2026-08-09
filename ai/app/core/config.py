from __future__ import annotations

import os
from dataclasses import dataclass


DEFAULT_TRAINING_MIN_EVENTS = 10000
MINIMUM_TRAINING_MIN_EVENTS = 10000


def _read_text(name: str, default: str) -> str:
    value = os.getenv(name)

    if value is None:
        return default

    normalized = value.strip()

    return normalized if normalized else default


def _read_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)

    if value is None:
        return default

    normalized = value.strip().lower()

    if normalized in {"true", "1", "yes", "on"}:
        return True

    if normalized in {"false", "0", "no", "off"}:
        return False

    return default


def _read_training_min_events() -> int:
    value = os.getenv("TRAINING_MIN_EVENTS")

    if value is None:
        return DEFAULT_TRAINING_MIN_EVENTS

    try:
        parsed = int(value.strip())
    except ValueError:
        return DEFAULT_TRAINING_MIN_EVENTS

    return max(parsed, MINIMUM_TRAINING_MIN_EVENTS)


@dataclass(frozen=True)
class AiServiceSettings:
    service_name: str
    service_version: str
    environment: str
    provider_name: str
    model_name: str
    auto_learning_enabled: bool
    training_min_events: int
    model_promotion_requires_eval_pass: bool


def load_settings() -> AiServiceSettings:
    return AiServiceSettings(
        service_name=_read_text("AI_SERVICE_NAME", "poster-python-ai"),
        service_version=_read_text("AI_SERVICE_VERSION", "0.1.0"),
        environment=_read_text("AI_SERVICE_ENVIRONMENT", "development"),
        provider_name=_read_text("AI_PROVIDER_NAME", "poster-python-ai"),
        model_name=_read_text("AI_MODEL_NAME", "poster-rule-classifier-v1"),
        auto_learning_enabled=_read_bool("AUTO_LEARNING_ENABLED", True),
        training_min_events=_read_training_min_events(),
        model_promotion_requires_eval_pass=_read_bool(
            "MODEL_PROMOTION_REQUIRES_EVAL_PASS",
            True,
        ),
    )
