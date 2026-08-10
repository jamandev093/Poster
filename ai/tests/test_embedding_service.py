from __future__ import annotations

import unittest

from app.services.embedding_service import (
    EMBEDDING_INFERENCE_FAILED_REASON,
    EMBEDDING_MODEL_LOAD_FAILED_REASON,
    EMBEDDING_UNAVAILABLE_REASON,
    create_embedding_result,
)


class _FakeEmbedding:
    def __init__(
        self,
        values: list[float],
    ) -> None:
        self._values = values

    def tolist(
        self,
    ) -> list[float]:
        return self._values


class _FakeModel:
    def __init__(
        self,
        values: list[float],
    ) -> None:
        self.values = values

    def encode(
        self,
        text: str,
        *,
        normalize_embeddings: bool,
        convert_to_numpy: bool,
        show_progress_bar: bool,
    ) -> _FakeEmbedding:
        if not text:
            raise ValueError(
                "text required"
            )

        if not normalize_embeddings:
            raise AssertionError(
                "Embeddings must be normalized."
            )

        if not convert_to_numpy:
            raise AssertionError(
                "Expected NumPy output."
            )

        if show_progress_bar:
            raise AssertionError(
                "Progress output must remain disabled."
            )

        return _FakeEmbedding(
            self.values
        )


class EmbeddingServiceTests(
    unittest.TestCase
):
    def test_unconfigured_model_remains_disabled_safe(
        self,
    ) -> None:
        result = create_embedding_result(
            text="Poster knowledge discovery",
            provider_name="poster-python-ai",
            model_name="unconfigured",
            now="2026-08-10T08:00:00Z",
        )

        self.assertFalse(
            result["available"]
        )

        self.assertEqual(
            result["dimensions"],
            0,
        )

        self.assertEqual(
            result["vector"],
            [],
        )

        self.assertEqual(
            result["reason"],
            EMBEDDING_UNAVAILABLE_REASON,
        )

    def test_returns_real_vector_from_configured_model(
        self,
    ) -> None:
        result = create_embedding_result(
            text="NASA discovers a new exoplanet",
            provider_name="poster-python-ai",
            model_name="test-model",
            now="2026-08-10T08:00:00Z",
            model_loader=lambda _:
                _FakeModel(
                    [
                        0.1,
                        -0.2,
                        0.3,
                    ]
                ),
        )

        self.assertTrue(
            result["available"]
        )

        self.assertEqual(
            result["dimensions"],
            3,
        )

        self.assertEqual(
            result["vector"],
            [
                0.1,
                -0.2,
                0.3,
            ],
        )

        self.assertIsNone(
            result["reason"]
        )

    def test_model_load_failure_is_disabled_safe(
        self,
    ) -> None:
        def fail_loader(
            _model_name: str,
        ) -> object:
            raise RuntimeError(
                "model unavailable"
            )

        result = create_embedding_result(
            text="Physics research",
            provider_name="poster-python-ai",
            model_name="missing-model",
            model_loader=fail_loader,
        )

        self.assertFalse(
            result["available"]
        )

        self.assertEqual(
            result["reason"],
            EMBEDDING_MODEL_LOAD_FAILED_REASON,
        )

    def test_invalid_vector_is_disabled_safe(
        self,
    ) -> None:
        result = create_embedding_result(
            text="Computer science",
            provider_name="poster-python-ai",
            model_name="test-model",
            model_loader=lambda _:
                _FakeModel(
                    [
                        0.1,
                        float("nan"),
                    ]
                ),
        )

        self.assertFalse(
            result["available"]
        )

        self.assertEqual(
            result["reason"],
            EMBEDDING_INFERENCE_FAILED_REASON,
        )

    def test_rejects_empty_text(
        self,
    ) -> None:
        with self.assertRaises(
            ValueError
        ):
            create_embedding_result(
                text="   ",
                provider_name="poster-python-ai",
                model_name="test-model",
            )


if __name__ == "__main__":
    unittest.main()