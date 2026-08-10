from __future__ import annotations

from datetime import UTC, datetime
from functools import lru_cache
import math
from typing import Any, Callable


EMBEDDING_UNAVAILABLE_REASON = (
    "embedding_model_not_configured"
)

EMBEDDING_MODEL_LOAD_FAILED_REASON = (
    "embedding_model_load_failed"
)

EMBEDDING_INFERENCE_FAILED_REASON = (
    "embedding_inference_failed"
)

UNCONFIGURED_MODEL_NAMES = {
    "",
    "unconfigured",
    "disabled",
    "none",
}


@lru_cache(maxsize=4)
def _load_embedding_model(
    model_name: str,
) -> Any:
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(
        model_name
    )


def _generated_at(
    now: str | None,
) -> str:
    return (
        now
        or datetime.now(
            UTC
        ).isoformat().replace(
            "+00:00",
            "Z",
        )
    )


def _unavailable(
    *,
    provider_name: str,
    model_name: str,
    generated_at: str,
    reason: str,
) -> dict[str, object]:
    return {
        "available": False,
        "dimensions": 0,
        "vector": [],
        "provider": provider_name,
        "model": model_name,
        "generatedAt": generated_at,
        "reason": reason,
    }


def create_embedding_result(
    *,
    text: str,
    provider_name: str,
    model_name: str,
    now: str | None = None,
    model_loader: Callable[[str], Any] | None = None,
) -> dict[str, object]:
    cleaned_text = text.strip()

    if not cleaned_text:
        raise ValueError(
            "Embedding text cannot be empty."
        )

    cleaned_provider = provider_name.strip()

    if not cleaned_provider:
        raise ValueError(
            "Embedding provider cannot be empty."
        )

    cleaned_model = model_name.strip()

    generated_at = _generated_at(
        now
    )

    if (
        cleaned_model.lower()
        in UNCONFIGURED_MODEL_NAMES
    ):
        return _unavailable(
            provider_name=cleaned_provider,
            model_name=cleaned_model,
            generated_at=generated_at,
            reason=EMBEDDING_UNAVAILABLE_REASON,
        )

    loader = (
        model_loader
        or _load_embedding_model
    )

    try:
        model = loader(
            cleaned_model
        )
    except Exception:
        return _unavailable(
            provider_name=cleaned_provider,
            model_name=cleaned_model,
            generated_at=generated_at,
            reason=EMBEDDING_MODEL_LOAD_FAILED_REASON,
        )

    try:
        encoded = model.encode(
            cleaned_text,
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        )

        values = encoded.tolist()

        if not isinstance(
            values,
            list,
        ):
            raise ValueError(
                "Embedding model returned a non-vector result."
            )

        vector = [
            float(value)
            for value
            in values
        ]

        if not vector:
            raise ValueError(
                "Embedding model returned an empty vector."
            )

        if not all(
            math.isfinite(value)
            for value
            in vector
        ):
            raise ValueError(
                "Embedding vector contains non-finite values."
            )

    except Exception:
        return _unavailable(
            provider_name=cleaned_provider,
            model_name=cleaned_model,
            generated_at=generated_at,
            reason=EMBEDDING_INFERENCE_FAILED_REASON,
        )

    return {
        "available": True,
        "dimensions": len(vector),
        "vector": vector,
        "provider": cleaned_provider,
        "model": cleaned_model,
        "generatedAt": generated_at,
        "reason": None,
    }