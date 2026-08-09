from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


ModelPromotionGateStatus = Literal[
    "allowed",
    "blocked",
]


@dataclass(frozen=True)
class ModelPromotionDecision:
    status: ModelPromotionGateStatus
    can_promote: bool
    reason: str


def evaluate_model_promotion(
    *,
    evaluation_passed: bool | None,
    requires_eval_pass: bool,
) -> ModelPromotionDecision:
    if evaluation_passed is False:
        return ModelPromotionDecision(
            status="blocked",
            can_promote=False,
            reason="evaluation_failed",
        )

    if requires_eval_pass and evaluation_passed is not True:
        return ModelPromotionDecision(
            status="blocked",
            can_promote=False,
            reason="evaluation_pass_required",
        )

    return ModelPromotionDecision(
        status="allowed",
        can_promote=True,
        reason=(
            "evaluation_passed"
            if evaluation_passed is True
            else "evaluation_not_required"
        ),
    )