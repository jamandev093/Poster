from __future__ import annotations

from dataclasses import dataclass, replace
from typing import Literal

from app.services.model_evaluation import ModelPromotionDecision


ModelVersionState = Literal[
    "active",
    "candidate",
    "rejected",
]


@dataclass(frozen=True)
class ModelVersionRecord:
    model_id: str
    state: ModelVersionState
    created_at: str
    activated_at: str | None = None
    rejected_at: str | None = None


@dataclass(frozen=True)
class ModelRegistrySnapshot:
    active_model: ModelVersionRecord | None
    candidate_models: tuple[ModelVersionRecord, ...]
    rejected_models: tuple[ModelVersionRecord, ...]
    rollback_model_ids: tuple[str, ...]


@dataclass(frozen=True)
class ModelPromotionResult:
    promoted: bool
    reason: str
    registry: ModelRegistrySnapshot


def create_empty_model_registry() -> ModelRegistrySnapshot:
    return ModelRegistrySnapshot(
        active_model=None,
        candidate_models=(),
        rejected_models=(),
        rollback_model_ids=(),
    )


def _clean_model_id(model_id: str) -> str:
    cleaned = model_id.strip()

    if not cleaned:
        raise ValueError("Model id cannot be empty.")

    return cleaned


def _registered_model_ids(
    registry: ModelRegistrySnapshot,
) -> set[str]:
    result = set(registry.rollback_model_ids)

    if registry.active_model is not None:
        result.add(registry.active_model.model_id)

    result.update(
        model.model_id
        for model in registry.candidate_models
    )

    result.update(
        model.model_id
        for model in registry.rejected_models
    )

    return result


def register_candidate_model(
    *,
    registry: ModelRegistrySnapshot,
    model_id: str,
    created_at: str,
) -> ModelRegistrySnapshot:
    cleaned_model_id = _clean_model_id(model_id)

    if cleaned_model_id in _registered_model_ids(registry):
        raise ValueError(
            f"Model id is already registered: {cleaned_model_id}"
        )

    candidate = ModelVersionRecord(
        model_id=cleaned_model_id,
        state="candidate",
        created_at=created_at,
    )

    return replace(
        registry,
        candidate_models=(
            *registry.candidate_models,
            candidate,
        ),
    )


def promote_candidate_model(
    *,
    registry: ModelRegistrySnapshot,
    model_id: str,
    decision: ModelPromotionDecision,
    activated_at: str,
) -> ModelPromotionResult:
    cleaned_model_id = _clean_model_id(model_id)

    candidate = next(
        (
            model
            for model in registry.candidate_models
            if model.model_id == cleaned_model_id
        ),
        None,
    )

    if candidate is None:
        raise ValueError(
            f"Candidate model was not found: {cleaned_model_id}"
        )

    if not decision.can_promote:
        return ModelPromotionResult(
            promoted=False,
            reason=decision.reason,
            registry=registry,
        )

    rollback_model_ids = registry.rollback_model_ids

    if registry.active_model is not None:
        previous_model_id = registry.active_model.model_id

        if previous_model_id not in rollback_model_ids:
            rollback_model_ids = (
                *rollback_model_ids,
                previous_model_id,
            )

    active_model = replace(
        candidate,
        state="active",
        activated_at=activated_at,
    )

    updated_registry = replace(
        registry,
        active_model=active_model,
        candidate_models=tuple(
            model
            for model in registry.candidate_models
            if model.model_id != cleaned_model_id
        ),
        rollback_model_ids=rollback_model_ids,
    )

    return ModelPromotionResult(
        promoted=True,
        reason=decision.reason,
        registry=updated_registry,
    )


def reject_candidate_model(
    *,
    registry: ModelRegistrySnapshot,
    model_id: str,
    rejected_at: str,
) -> ModelRegistrySnapshot:
    cleaned_model_id = _clean_model_id(model_id)

    candidate = next(
        (
            model
            for model in registry.candidate_models
            if model.model_id == cleaned_model_id
        ),
        None,
    )

    if candidate is None:
        raise ValueError(
            f"Candidate model was not found: {cleaned_model_id}"
        )

    rejected_model = replace(
        candidate,
        state="rejected",
        rejected_at=rejected_at,
    )

    return replace(
        registry,
        candidate_models=tuple(
            model
            for model in registry.candidate_models
            if model.model_id != cleaned_model_id
        ),
        rejected_models=(
            *registry.rejected_models,
            rejected_model,
        ),
    )