from __future__ import annotations

import unittest

from app.core.config import AiServiceSettings
from app.services.dataset_builder import create_dataset_build_plan
from app.services.training_pipeline import evaluate_training_cycle


def create_settings(
    *,
    auto_learning_enabled: bool = True,
    training_min_events: int = 10000,
) -> AiServiceSettings:
    return AiServiceSettings(
        service_name="poster-python-ai",
        service_version="0.1.0",
        environment="test",
        provider_name="poster-python-ai",
        model_name="poster-rule-classifier-v1",
        embedding_model_name="unconfigured",
        auto_learning_enabled=auto_learning_enabled,
        training_min_events=training_min_events,
        model_promotion_requires_eval_pass=True,
    )


class TrainingPipelineTests(unittest.TestCase):
    def test_waits_when_event_threshold_is_not_met(self) -> None:
        result = evaluate_training_cycle(
            settings=create_settings(),
            observed_event_count=9999,
        )

        self.assertEqual(result.status, "not_enough_data")
        self.assertFalse(result.training_started)
        self.assertFalse(result.dataset_plan.can_build_dataset)
        self.assertEqual(result.dataset_plan.remaining_event_count, 1)

    def test_threshold_allows_dataset_but_does_not_fake_training(self) -> None:
        result = evaluate_training_cycle(
            settings=create_settings(),
            observed_event_count=10000,
        )

        self.assertEqual(result.status, "ready_noop")
        self.assertTrue(result.dataset_plan.can_build_dataset)
        self.assertFalse(result.training_started)
        self.assertEqual(
            result.reason,
            "training_engine_not_implemented",
        )

    def test_disabled_auto_learning_blocks_dataset_and_training(self) -> None:
        result = evaluate_training_cycle(
            settings=create_settings(
                auto_learning_enabled=False,
            ),
            observed_event_count=50000,
        )

        self.assertEqual(result.status, "disabled")
        self.assertFalse(result.dataset_plan.can_build_dataset)
        self.assertFalse(result.training_started)

    def test_dataset_threshold_cannot_drop_below_10000(self) -> None:
        plan = create_dataset_build_plan(
            auto_learning_enabled=True,
            observed_event_count=9999,
            training_min_events=100,
        )

        self.assertEqual(plan.minimum_event_count, 10000)
        self.assertEqual(plan.status, "not_enough_data")


if __name__ == "__main__":
    unittest.main()