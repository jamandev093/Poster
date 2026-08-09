from __future__ import annotations

import unittest

from app.core.config import MINIMUM_TRAINING_MIN_EVENTS, load_settings
from app.services.rule_classifier import classify_content


class RuleClassifierTests(unittest.TestCase):
    def test_classifies_technology_content(self) -> None:
        result = classify_content(
            source_key="tech-news",
            url="https://example.com/ai-startup",
            title="AI startup launches cloud software platform",
            excerpt="The company is building data tools for enterprise teams.",
            categories=[],
            now="2026-08-09T00:00:00Z",
        )

        self.assertEqual(result["primaryCategory"], "technology")
        self.assertIn("technology", result["topics"])
        self.assertEqual(result["provider"], "poster-python-ai")
        self.assertEqual(result["model"], "poster-rule-classifier-v1")
        self.assertEqual(result["classifiedAt"], "2026-08-09T00:00:00Z")

    def test_uses_input_category_when_keywords_are_not_found(self) -> None:
        result = classify_content(
            source_key="publisher",
            url="https://example.com/story",
            title="Local feature story",
            excerpt=None,
            categories=["Travel"],
            now="2026-08-09T00:00:00Z",
        )

        self.assertEqual(result["primaryCategory"], "travel")
        self.assertIn("Travel", result["topics"])

    def test_defaults_to_general_without_keywords_or_categories(self) -> None:
        result = classify_content(
            source_key="publisher",
            url="https://example.com/story",
            title="Daily note",
            excerpt=None,
            categories=[],
            now="2026-08-09T00:00:00Z",
        )

        self.assertEqual(result["primaryCategory"], "general")
        self.assertEqual(result["topics"], ["general"])

    def test_learning_policy_env_defaults_are_safe(self) -> None:
        settings = load_settings()

        self.assertTrue(settings.auto_learning_enabled)
        self.assertGreaterEqual(
            settings.training_min_events,
            MINIMUM_TRAINING_MIN_EVENTS,
        )
        self.assertTrue(settings.model_promotion_requires_eval_pass)


if __name__ == "__main__":
    unittest.main()
