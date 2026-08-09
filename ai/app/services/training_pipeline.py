from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from app.core.config import AiServiceSettings
from app.services.dataset_builder import (
    DatasetBuildPlan,
    create_dataset_build_plan,
)


TrainingCycleStatus = Literal[
    "disabled",
    "not_enough_data",
    "ready_noop",
]


@dataclass(frozen=True)
class TrainingCycleResult:
    status: TrainingCycleStatus
    dataset_plan: DatasetBuildPlan
    training_started: bool
    reason: str


def evaluate_training_cycle(
    *,
    settings: AiServiceSettings,
    observed_event_count: int,
) -> TrainingCycleResult:
    dataset_plan = create_dataset_build_plan(
        auto_learning_enabled=settings.auto_learning_enabled,
        observed_event_count=observed_event_count,
        training_min_events=settings.training_min_events,
    )

    if dataset_plan.status == "disabled":
        return TrainingCycleResult(
            status="disabled",
            dataset_plan=dataset_plan,
            training_started=False,
            reason="auto_learning_disabled",
        )

    if dataset_plan.status == "not_enough_data":
        return TrainingCycleResult(
            status="not_enough_data",
            dataset_plan=dataset_plan,
            training_started=False,
            reason="minimum_event_threshold_not_met",
        )

    return TrainingCycleResult(
        status="ready_noop",
        dataset_plan=dataset_plan,
        training_started=False,
        reason="training_engine_not_implemented",
    )