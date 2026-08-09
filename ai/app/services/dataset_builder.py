from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from app.core.config import MINIMUM_TRAINING_MIN_EVENTS


DatasetBuildStatus = Literal[
    "disabled",
    "not_enough_data",
    "ready",
]


@dataclass(frozen=True)
class DatasetBuildPlan:
    status: DatasetBuildStatus
    observed_event_count: int
    minimum_event_count: int
    remaining_event_count: int
    can_build_dataset: bool


def create_dataset_build_plan(
    *,
    auto_learning_enabled: bool,
    observed_event_count: int,
    training_min_events: int,
) -> DatasetBuildPlan:
    if observed_event_count < 0:
        raise ValueError("Observed event count cannot be negative.")

    minimum_event_count = max(
        training_min_events,
        MINIMUM_TRAINING_MIN_EVENTS,
    )

    remaining_event_count = max(
        minimum_event_count - observed_event_count,
        0,
    )

    if not auto_learning_enabled:
        return DatasetBuildPlan(
            status="disabled",
            observed_event_count=observed_event_count,
            minimum_event_count=minimum_event_count,
            remaining_event_count=remaining_event_count,
            can_build_dataset=False,
        )

    if observed_event_count < minimum_event_count:
        return DatasetBuildPlan(
            status="not_enough_data",
            observed_event_count=observed_event_count,
            minimum_event_count=minimum_event_count,
            remaining_event_count=remaining_event_count,
            can_build_dataset=False,
        )

    return DatasetBuildPlan(
        status="ready",
        observed_event_count=observed_event_count,
        minimum_event_count=minimum_event_count,
        remaining_event_count=0,
        can_build_dataset=True,
    )