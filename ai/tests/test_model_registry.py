from __future__ import annotations

import unittest

from app.services.model_evaluation import evaluate_model_promotion
from app.services.model_registry import (
    create_empty_model_registry,
    promote_candidate_model,
    register_candidate_model,
    reject_candidate_model,
)


class ModelRegistryTests(unittest.TestCase):
    def test_registers_candidate_model(self) -> None:
        registry = register_candidate_model(
            registry=create_empty_model_registry(),
            model_id="poster-model-v1",
            created_at="2026-08-09T12:50:00Z",
        )

        self.assertEqual(len(registry.candidate_models), 1)
        self.assertEqual(
            registry.candidate_models[0].state,
            "candidate",
        )

    def test_blocks_promotion_without_required_evaluation_pass(self) -> None:
        registry = register_candidate_model(
            registry=create_empty_model_registry(),
            model_id="poster-model-v1",
            created_at="2026-08-09T12:50:00Z",
        )

        decision = evaluate_model_promotion(
            evaluation_passed=None,
            requires_eval_pass=True,
        )

        result = promote_candidate_model(
            registry=registry,
            model_id="poster-model-v1",
            decision=decision,
            activated_at="2026-08-09T12:55:00Z",
        )

        self.assertFalse(result.promoted)
        self.assertEqual(
            result.reason,
            "evaluation_pass_required",
        )
        self.assertIsNone(result.registry.active_model)

    def test_promotes_passed_candidate_and_keeps_rollback_target(self) -> None:
        registry = register_candidate_model(
            registry=create_empty_model_registry(),
            model_id="poster-model-v1",
            created_at="2026-08-09T12:50:00Z",
        )

        passed = evaluate_model_promotion(
            evaluation_passed=True,
            requires_eval_pass=True,
        )

        first = promote_candidate_model(
            registry=registry,
            model_id="poster-model-v1",
            decision=passed,
            activated_at="2026-08-09T12:55:00Z",
        )

        registry = register_candidate_model(
            registry=first.registry,
            model_id="poster-model-v2",
            created_at="2026-08-09T13:00:00Z",
        )

        second = promote_candidate_model(
            registry=registry,
            model_id="poster-model-v2",
            decision=passed,
            activated_at="2026-08-09T13:05:00Z",
        )

        self.assertTrue(second.promoted)
        self.assertEqual(
            second.registry.active_model.model_id,
            "poster-model-v2",
        )
        self.assertIn(
            "poster-model-v1",
            second.registry.rollback_model_ids,
        )

    def test_rejects_failed_candidate(self) -> None:
        registry = register_candidate_model(
            registry=create_empty_model_registry(),
            model_id="poster-model-bad",
            created_at="2026-08-09T13:10:00Z",
        )

        decision = evaluate_model_promotion(
            evaluation_passed=False,
            requires_eval_pass=True,
        )

        self.assertFalse(decision.can_promote)
        self.assertEqual(
            decision.reason,
            "evaluation_failed",
        )

        registry = reject_candidate_model(
            registry=registry,
            model_id="poster-model-bad",
            rejected_at="2026-08-09T13:15:00Z",
        )

        self.assertEqual(len(registry.candidate_models), 0)
        self.assertEqual(len(registry.rejected_models), 1)
        self.assertEqual(
            registry.rejected_models[0].state,
            "rejected",
        )


if __name__ == "__main__":
    unittest.main()