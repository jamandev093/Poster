from __future__ import annotations

import unittest

from app.services.embedding_service import (
    EMBEDDING_UNAVAILABLE_REASON,
    create_embedding_result,
)


class EmbeddingServiceTests(unittest.TestCase):
    def test_returns_disabled_safe_result_without_fake_vector(self) -> None:
        result = create_embedding_result(
            text="Poster knowledge discovery",
            provider_name="poster-python-ai",
            model_name="unconfigured",
            now="2026-08-09T12:45:00Z",
        )

        self.assertFalse(result["available"])
        self.assertEqual(result["dimensions"], 0)
        self.assertEqual(result["vector"], [])
        self.assertEqual(
            result["reason"],
            EMBEDDING_UNAVAILABLE_REASON,
        )

    def test_preserves_provider_model_and_timestamp(self) -> None:
        result = create_embedding_result(
            text="AI infrastructure",
            provider_name="poster-python-ai",
            model_name="future-embedding-model",
            now="2026-08-09T12:46:00Z",
        )

        self.assertEqual(result["provider"], "poster-python-ai")
        self.assertEqual(result["model"], "future-embedding-model")
        self.assertEqual(
            result["generatedAt"],
            "2026-08-09T12:46:00Z",
        )


if __name__ == "__main__":
    unittest.main()